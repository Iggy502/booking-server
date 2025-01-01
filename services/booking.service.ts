//booking operations
// Objective: Booking service to handle booking operations
import {Booking} from '../models/booking.model';
import {
    IBookingCreate,
    IBookingDocument,
    IBookingResponse,
    IBookingUpdate,
    PopulatedBookingDocument,
    PopulatedBookingResponse
} from '../models/interfaces';
import {Property} from "../models/property.model";
import {injectable} from "tsyringe";
import {User} from "../models/user.model";
import {BadRequest, InternalServerError, NotFound} from "http-errors";
import {MessageRequest} from "../models/interfaces/chat.types";
import mongoose from "mongoose";

@injectable()
export class BookingService {

    async createBooking(bookingData: IBookingCreate): Promise<IBookingResponse> {

        if (!this.validateCheckOutDate(bookingData.checkIn, bookingData.checkOut)) {
            throw BadRequest('Check out date should be after check in date');
        }

        const property = await Property.findOne({_id: bookingData.property, available: true});
        const guest = await User.findOne({_id: bookingData.guest});

        if (!property) {
            throw NotFound('Property not found or not available');

        }

        if (!guest) {
            throw NotFound('Guest not found');
        }

        //check overlapping bookings
        const overlappingBookings = await Booking.exists({
            property: bookingData.property,
            status: {$in: ['confirmed', 'pending']},
            $nor: [
                {checkOut: {$lt: bookingData.checkIn}},
                {checkIn: {$gt: bookingData.checkOut}}
            ]
        });


        if (overlappingBookings) {
            throw BadRequest('Booking overlaps with existing booking');
        }

        if (bookingData.numberOfGuests > property.maxGuests) {
            throw BadRequest('Number of guests exceeds property limit');
        }

        const booking = await Booking.create({
            ...bookingData,
            status: 'pending',
            conversation: {messages: [], active: true}, //create conversation
            totalPrice: this.calculateTotalPrice(property.pricePerNight, bookingData.checkIn, bookingData.checkOut)
        });


        return this.mapToBookingResponse(booking);
    }

    async getBookingById(bookingId: string): Promise<IBookingResponse> {
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            throw NotFound('Booking not found');
        }

        return this.mapToBookingResponse(booking);
    }

    async getBookingsByPropertyId(propertyId: string): Promise<IBookingResponse[]> {
        const bookings: IBookingDocument[] = await Booking.find({property: propertyId});
        return bookings.map(booking => this.mapToBookingResponse(booking));
    }

    async getBookingsByPropertyIds(propertyIds: string[]): Promise<IBookingResponse[]> {
        const bookings: IBookingDocument[] = await Booking.find({
            property: {$in: propertyIds},
            status: {$ne: 'cancelled'}
        });
        return bookings.map(booking => this.mapToBookingResponse(booking));
    }

    async getBookingsByUserGuestId(userId: string): Promise<IBookingResponse[]> {
        const bookings: IBookingDocument[] = await Booking.find({guest: userId});
        return bookings.map(booking => this.mapToBookingResponse(booking));
    }

    async getBookingsByUserGuestOrHostId(userId: string): Promise<PopulatedBookingResponse[]> {
        // First use aggregate to find matching bookings
        const matchingBookings = await Booking.aggregate([
            {
                // Simple lookup just to match on owner
                $lookup: {
                    from: 'properties',
                    localField: 'property',
                    foreignField: '_id',
                    as: 'propertyData'
                }
            },
            {
                $unwind: '$propertyData'
            },
            {
                $match: {
                    $or: [
                        {guest: new mongoose.Types.ObjectId(userId)},
                        {'propertyData.owner': new mongoose.Types.ObjectId(userId)}
                    ]
                }
            },
            {
                // Only keep the booking _id for the subsequent populate
                $project: {
                    _id: 1
                }
            }
        ]);

        // Get the matching booking IDs
        const bookingIds = matchingBookings.map(b => b._id);

        const bookingsForIdsPopulated = await Booking.find({_id: {$in: bookingIds}})
            .populate<PopulatedBookingDocument>('property')
            .populate<PopulatedBookingDocument>('guest') as PopulatedBookingDocument[];


        return bookingsForIdsPopulated.map(booking => this.mapToPopulatedBookingResponse(booking));
    }


    async updateBooking(bookingId: string, bookingData: IBookingUpdate): Promise<IBookingResponse> {


        const booking = await Booking.findById(bookingId);

        if (!booking) {
            throw NotFound('Booking not found');
        }

        if (bookingData.checkIn && bookingData.checkOut) {
            if (!this.validateCheckOutDate(bookingData.checkIn, bookingData.checkOut)) {
                throw BadRequest('Check out date should be after check in date');
            }

            const property = await Property.findById(booking.property);

            if (property) {
                bookingData.totalPrice = this.calculateTotalPrice(property.pricePerNight, bookingData.checkIn, bookingData.checkOut);
            }
        }

        const updatedBooking = await Booking.findByIdAndUpdate(bookingId, bookingData, {new: true});

        if (!updatedBooking) {
            throw InternalServerError('Internal Server Error');
        }

        return this.mapToBookingResponse(updatedBooking);
    }

    async deleteBooking(bookingId: string): Promise<IBookingResponse> {
        const booking = await Booking.findByIdAndDelete(bookingId);

        if (!booking) {
            throw NotFound('Booking not found');
        }

        return this.mapToBookingResponse(booking);
    }

    async getBookingsWithinDateRange(startDate: Date, endDate: Date): Promise<IBookingResponse[]> {
        const bookings: IBookingDocument[] = await Booking.find({
            checkIn: {$gte: startDate},
            checkOut: {$lte: endDate}
        });

        return bookings.map(booking => this.mapToBookingResponse(booking));
    }

    async findMatchingBookingForConversation(conversationId: string) {
        return Booking.findOne({'conversation._id': conversationId});
    }


    private mapToBookingResponse(booking: IBookingDocument): IBookingResponse {
        return booking.toObject() as IBookingResponse;
    }

    private mapToPopulatedBookingResponse(booking: PopulatedBookingDocument): PopulatedBookingResponse {
        return booking.toObject() as PopulatedBookingResponse;
    }


    calculateDuration(endDate: Date, startDate: Date): number {
        return (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    }

    calculateTotalPrice(propertyPrice: number, checkIn: Date, checkOut: Date): number {
        return propertyPrice * this.calculateDuration(checkOut, checkIn);
    }

    validateCheckOutDate(checkIn: Date, checkOut: Date): boolean {
        return checkOut > checkIn;
    }


    async saveChatMessageForConversationAndRelatedBooking(message: MessageRequest): Promise<IBookingDocument> {
        return Booking.findOne({'conversation._id': message.conversationId}).then(booking => {
            if (!booking) {
                throw NotFound('Booking not found for conversation');
            }

            booking.conversation.messages.push({...message, read: false});
            return booking.save();
        });
    }
}



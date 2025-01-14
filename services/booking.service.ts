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
import {container, injectable} from "tsyringe";
import {User} from "../models/user.model";
import {BadRequest, Forbidden, InternalServerError, NotFound} from "http-errors";
import {MessageRequest} from "../models/interfaces/chat.types";
import mongoose from "mongoose";
import {PropertyService} from "./property.service";
import {ImageConversionUtil} from "./util/image/image-conversion-util";


@injectable()
export class BookingService {

    private propertyService: PropertyService;

    constructor() {
        this.propertyService = container.resolve(PropertyService);
    }

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
            .populate<PopulatedBookingDocument>({
                path: 'property',
                select: 'name owner',
                populate: {
                    path: 'owner',
                    select: 'firstName lastName profilePicturePath'
                }
            })
            .populate<PopulatedBookingDocument>({
                path: 'guest',
                select: 'firstName lastName profilePicturePath'
            }).select('id property guest conversation').exec()
            .then(bookings => bookings as PopulatedBookingDocument[]);

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

    async findMatchingBookingForConversation(conversationId: string) {
        return Booking.findOne({'conversation._id': conversationId});
    }


    private mapToBookingResponse(booking: IBookingDocument): IBookingResponse {
        return booking.toObject() as IBookingResponse;
    }

    private mapToPopulatedBookingResponse(booking: PopulatedBookingDocument): PopulatedBookingResponse {


        let bookingObject = booking.toObject() as PopulatedBookingResponse;

        if (bookingObject?.property?.owner?.profilePicturePath) {
            bookingObject.property.owner.profilePicturePath = ImageConversionUtil
                .convertPathToUrl(bookingObject.property.owner.profilePicturePath, process.env.AWS_S3_BUCKET || '');
        }

        if (bookingObject?.guest?.profilePicturePath) {
            bookingObject.guest.profilePicturePath =
                ImageConversionUtil.convertPathToUrl(bookingObject.guest.profilePicturePath, process.env.AWS_S3_BUCKET || '');
        }


        return bookingObject;
    }

    async saveChatMessageForConversationAndRelatedBooking(message: MessageRequest): Promise<IBookingDocument> {
        return Booking.findOne({'conversation._id': message.conversationId}).then(booking => {
            if (!booking) {
                throw NotFound('Booking not found for conversation');
            }

            booking.conversation.messages.push({
                ...message,
                from: new mongoose.Types.ObjectId(message.from),
                to: new mongoose.Types.ObjectId(message.to),
                read: false
            });
            return booking.save();
        });
    }

    async markConversationAsRead(conversationId: string, userId: string) {
        const bookingForConversation: IBookingDocument | null =
            await this.findMatchingBookingForConversation(conversationId);

        if (!bookingForConversation) {
            throw NotFound('Booking not found for conversation');
        }

        const relatedProperty = await this.propertyService.getPropertyById(bookingForConversation.property.toString());

        if (!relatedProperty) {
            throw NotFound('Property not found for booking linked to this conversation. Cannot verify the owner...');
        }

        if (relatedProperty.owner.toString() !== userId && bookingForConversation.guest.toString() !== userId) {
            throw Forbidden('You do not have permission to update the conversation status');
        }

        bookingForConversation.conversation.messages.forEach((message) => {
            message.read = true;
        });

        return bookingForConversation.save();
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


}



//booking operations
// Objective: Booking service to handle booking operations
import {Booking} from '../models/booking.model';
import {IBookingBase, IBookingCreate, IBookingDocument, IBookingResponse, IBookingUpdate} from '../models/interfaces';
import {Property} from "../models/property.model";
import {injectable} from "tsyringe";
import {HttpError} from "./exceptions/http-error";
import {User} from "../models/user.model";
import {BadRequest, InternalServerError, NotFound} from "http-errors";

@injectable()
export class BookingService {

    async createBooking(bookingData: IBookingCreate): Promise<IBookingResponse> {

        if (!this.validateCheckOutDate(bookingData.checkIn, bookingData.checkOut)) {
            throw new HttpError(400, 'Check out date should be after check in date');
        }

        const property = await Property.findById(bookingData.property);
        const guest = await User.findOne({_id: bookingData.guest});

        if (!property) {
            throw NotFound('Property not found');

        }

        if (!guest) {
            throw NotFound('Guest not found');
        }

        //check overlapping bookings
        const overlappingBookings = await Booking.findOne({
            property: bookingData.property,
            $or: [
                {checkIn: {$gte: bookingData.checkIn, $lt: bookingData.checkOut}},
                {
                    $and: [
                        {checkIn: {$lt: bookingData.checkIn}},
                        {checkOut: {$gt: bookingData.checkIn}}
                    ]
                }
            ],
        });

        if (overlappingBookings) {
            throw BadRequest('Booking overlaps with existing booking');
        }

        if (bookingData.numberOfGuests > property.maxGuests) {
            throw BadRequest('Number of guests exceeds property limit');
        }

        //check if property is available
        await Booking.find({property: bookingData.property});
        const booking = await Booking.create({
            ...bookingData,
            status: 'pending',
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

    async getBookingsByUserId(userId: string): Promise<IBookingResponse[]> {
        const bookings: IBookingDocument[] = await Booking.find({guest: userId});
        return bookings.map(booking => this.mapToBookingResponse(booking));
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

    private mapToBookingResponse(booking: IBookingDocument): IBookingResponse {
        return booking.toObject();
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



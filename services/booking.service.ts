//booking operations
// Objective: Booking service to handle booking operations
import {Booking} from '../models/booking.model';
import {IBookingCreate, IBookingResponse, IBookingUpdate} from '../models/interfaces';
import {Property} from "../models/property.model";
import {injectable} from "tsyringe";

@injectable()
export class BookingService {

    async createBooking(userId: string, bookingData: IBookingCreate): Promise<IBookingResponse> {
        const property = await Property.findById(bookingData.property);
        if (!property) {
            throw new Error('Property not found');
        }
        const duration = (new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) / (1000 * 60 * 60 * 24);

        const booking = await Booking.create({
            ...bookingData,
            guest: userId,
            totalPrice: property.pricePerNight * duration,
            status: 'pending'
        });

        return <IBookingResponse>booking.toObject();
    }

    async getBookingById(bookingId: string): Promise<IBookingResponse> {
        const booking = await Booking.findById(bookingId);
        return <IBookingResponse>booking?.toObject();
    }

    async updateBooking(bookingId: string, bookingData: IBookingUpdate): Promise<IBookingResponse> {
        const booking = await Booking.findByIdAndUpdate(bookingId, bookingData, {new: true});
        return <IBookingResponse>booking?.toObject();
    }

    async deleteBooking(bookingId: string): Promise<IBookingResponse> {
        const booking = await Booking.findByIdAndDelete(bookingId);
        return <IBookingResponse>booking?.toObject();
    }
}



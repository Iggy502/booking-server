//booking operations
// Objective: Booking service to handle booking operations
import {Booking} from '../models/booking.model';
import {IBookingCreate, IBookingDocument, IBookingResponse, IBookingUpdate} from '../models/interfaces';
import {Property} from "../models/property.model";
import {injectable} from "tsyringe";
import {HttpError} from "./exceptions/http-error";
import {User} from "../models/user.model";

@injectable()
export class BookingService {

    async createBooking(bookingData: IBookingCreate): Promise<IBookingResponse> {
        const property = await Property.findById(bookingData.property);
        const guest = await User.findOne({_id: bookingData.guest});

        if (!property) {
            throw new HttpError(404, 'Property not found');
        }

        if (!guest) {
            throw new HttpError(404, 'Guest not found');
        }

        if (bookingData.numberOfGuests > property.maxGuests) {
            throw new HttpError(400, 'Number of guests exceeds property limit');
        }

        if (!this.validateCheckOutDate(bookingData.checkIn, bookingData.checkOut)) {
            throw new HttpError(400, 'Check out date should be after check in date');
        }

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
            throw new HttpError(404, 'Booking not found');
        }

        return this.mapToBookingResponse(booking);

    }

    async getBookingsByUserId(userId: string): Promise<IBookingResponse[]> {
        const bookings: IBookingDocument[] = await Booking.find({guest: userId});
        return bookings.map(booking => this.mapToBookingResponse(booking));
    }

    async updateBooking(bookingId: string, bookingData: IBookingUpdate): Promise<IBookingResponse> {
        const booking = await Booking.findByIdAndUpdate(bookingId, bookingData, {new: true});

        if (!booking) {
            throw new HttpError(404, 'Booking not found');
        }

        return this.mapToBookingResponse(booking);
    }

    async deleteBooking(bookingId: string): Promise<IBookingResponse> {
        const booking = await Booking.findByIdAndDelete(bookingId);

        if (!booking) {
            throw new HttpError(404, 'Booking not found');
        }

        return this.mapToBookingResponse(booking);
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



import 'reflect-metadata';
import {BookingService} from '../booking.service';
import {Booking} from '../../models/booking.model';
import {IBookingCreate, IBookingResponse, IBookingUpdate} from '../../models/interfaces';
import mongoose from 'mongoose';
import {Property} from "../../models/property.model";
import {container} from "tsyringe";
import {HttpError} from "../../exceptions/http-error";

jest.mock('../../models/booking.model');
jest.mock('../../models/property.model');


describe('BookingService', () => {
    const mockBookingId = new mongoose.Types.ObjectId();
    const mockUserId = new mongoose.Types.ObjectId();
    const mockPropertyId = new mongoose.Types.ObjectId();
    const mockBooking: IBookingResponse = {
        id: mockBookingId.toString(),
        property: mockPropertyId,
        guest: mockUserId,
        checkIn: new Date(),
        checkOut: new Date(),
        totalPrice: 100,
        status: 'pending',
        numberOfGuests: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
    };


    const mockProperty = {
        _id: mockPropertyId,
        pricePerNight: 50,
        maxGuests: 4,
    };

    let bookingService: BookingService;

    beforeAll(() => {
        bookingService = container.resolve(BookingService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });


    it('should create a booking', async () => {
        const bookingData: IBookingCreate = {
            property: mockPropertyId,
            guest: mockUserId,
            checkIn: new Date(),
            checkOut: new Date(),
            numberOfGuests: 2,
        };

        (Property.findById as jest.Mock).mockResolvedValue(mockProperty);
        (Booking.create as jest.Mock).mockResolvedValue({
            ...mockBooking,
            toObject: () => mockBooking,
        });

        const result = await bookingService.createBooking(mockUserId.toString(), bookingData);
        expect(result).toEqual(mockBooking);
        expect(Property.findById).toHaveBeenCalledWith(mockPropertyId);
        expect(Booking.create).toHaveBeenCalledWith({
            ...bookingData,
            guest: mockUserId.toString(),
            totalPrice: mockProperty.pricePerNight * ((new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) / (1000 * 60 * 60 * 24)),
            status: 'pending'
        });
    });

    it('should throw an error if the property is not found', async () => {
        const bookingData: IBookingCreate = {
            property: mockPropertyId,
            guest: mockUserId,
            checkIn: new Date(),
            checkOut: new Date(),
            numberOfGuests: 2,
        };

        (Property.findById as jest.Mock).mockResolvedValue(null);

        await expect(bookingService.createBooking(mockUserId.toString(), bookingData))
            .rejects
            .toThrow(new HttpError(404, 'Property not found'));

        expect(Property.findById).toHaveBeenCalledWith(mockPropertyId);
    });

    it('should get a booking by id', async () => {
        (Booking.findById as jest.Mock).mockResolvedValue({
            ...mockBooking,
            toObject: () => mockBooking,
        });

        const result = await bookingService.getBookingById(mockBooking.id);
        expect(result).toEqual(mockBooking);
        expect(Booking.findById).toHaveBeenCalledWith(mockBooking.id);
    });

    it('should update a booking', async () => {
        const updateData: IBookingUpdate = {
            status: 'confirmed',
        };

        (Booking.findByIdAndUpdate as jest.Mock).mockResolvedValue({
            ...mockBooking,
            ...updateData,
            toObject: () => ({...mockBooking, ...updateData}),
        });

        const result = await bookingService.updateBooking(mockBooking.id, updateData);
        expect(result).toEqual({...mockBooking, ...updateData});
        expect(Booking.findByIdAndUpdate).toHaveBeenCalledWith(mockBooking.id, updateData, {new: true});
    });

    it('should delete a booking', async () => {
        (Booking.findByIdAndDelete as jest.Mock).mockResolvedValue({
            ...mockBooking,
            toObject: () => mockBooking,
        });

        const result = await bookingService.deleteBooking(mockBookingId.toString());
        expect(result).toEqual(mockBooking);
        expect(Booking.findByIdAndDelete).toHaveBeenCalledWith(mockBookingId.toString());
    });

    it('should get bookings by a valid field', async () => {
        const field = 'status';
        const value = 'pending';
        (Booking.find as jest.Mock).mockResolvedValue([{
            ...mockBooking,
            toObject: () => mockBooking,
        }]);

        const result = await bookingService.getBookingsByField(field, value);
        expect(result).toEqual([mockBooking]);
        expect(Booking.find).toHaveBeenCalledWith({[field]: value});
    });

    it('should throw an error if the field is invalid', async () => {
        const field = 'invalidField';
        const value = 'someValue';

        await expect(bookingService.getBookingsByField(field, value))
            .rejects
            .toThrow(HttpError);

        expect(Booking.find).not.toHaveBeenCalled();
    });

    it('should throw an error if the number of guests exceeds the property\'s max guests', async () => {
        const bookingData: IBookingCreate = {
            property: mockPropertyId,
            guest: mockUserId,
            checkIn: new Date(),
            checkOut: new Date(),
            numberOfGuests: 5, // Exceeds the maxGuests of 4
        };

        (Property.findById as jest.Mock).mockResolvedValue({...mockProperty, toObject: () => mockProperty});
        (Booking.create as jest.Mock).mockResolvedValue({
            ...mockBooking,
            toObject: () => mockBooking,
        });


        await expect(bookingService.createBooking(mockUserId.toString(), bookingData))
            .rejects
            .toThrow(new HttpError(400, "Number of guests exceeds property limit"));

        expect(Property.findById).toHaveBeenCalledWith(mockPropertyId);


    });


});


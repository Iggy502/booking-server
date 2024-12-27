// import 'reflect-metadata';
// import {BookingService} from '../booking.service';
// import {Property} from '../../models/property.model';
// import {User} from '../../models/user.model';
// import {Booking} from '../../models/booking.model';
// import {HttpError} from '../exceptions/http-error';
// import {Types} from 'mongoose';
// import {container} from "tsyringe";
//
// // Remove the node:test import and use Jest's describe
// jest.mock('../../models/property.model');
// jest.mock('../../models/user.model');
// jest.mock('../../models/booking.model');
//
// describe('BookingService', () => {
//     let bookingService: BookingService;
//
//     const mockProperty = {
//         _id: new Types.ObjectId(),
//         name: 'Test Property',
//         description: 'Test Description',
//         pricePerNight: 100,
//         maxGuests: 4,
//         owner: new Types.ObjectId(),
//         address: {
//             street: 'Test Street',
//             city: 'Test City',
//             country: 'Test Country',
//             postalCode: '12345'
//         },
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         toObject: jest.fn()
//     };
//
//     const mockUser = {
//         _id: new Types.ObjectId(),
//         name: 'Test User',
//         email: 'test@test.com'
//     };
//
//     const mockBooking = {
//         _id: new Types.ObjectId(),
//         property: mockProperty._id,
//         guest: mockUser._id,
//         checkIn: new Date(),
//         checkOut: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
//         totalPrice: 100,
//         status: 'pending',
//         numberOfGuests: 2,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//         toObject: jest.fn()
//     };
//
//     beforeEach(() => {
//         // Reset mocks before each test
//         jest.clearAllMocks();
//         // Initialize the service before each test
//         bookingService = container.resolve(BookingService);
//         // Setup mock returns
//         mockProperty.toObject.mockReturnValue({...mockProperty, id: mockProperty._id.toString()});
//         mockBooking.toObject.mockReturnValue({...mockBooking, id: mockBooking._id.toString()});
//     });
//
//     describe('createBooking', () => {
//         const createBookingData = {
//             property: mockProperty._id,
//             guest: mockUser._id,
//             checkIn: mockBooking.checkIn,
//             checkOut: mockBooking.checkOut,
//             numberOfGuests: 2
//         };
//
//         it('should successfully create a booking', async () => {
//             // Setup
//             (Property.findById as jest.Mock).mockResolvedValue(mockProperty);
//             (User.findOne as jest.Mock).mockResolvedValue(mockUser);
//             (Booking.create as jest.Mock).mockResolvedValue(mockBooking);
//
//             // Execute
//             const result = await bookingService.createBooking(createBookingData);
//
//             // Assert
//             expect(Property.findById).toHaveBeenCalledWith(createBookingData.property);
//             expect(User.findOne).toHaveBeenCalledWith({_id: createBookingData.guest});
//             expect(Booking.create).toHaveBeenCalledWith({
//                 ...createBookingData,
//                 status: 'pending',
//                 totalPrice: 100
//             });
//             expect(result).toEqual(expect.objectContaining({
//                 id: expect.any(String),
//                 property: createBookingData.property,
//                 guest: createBookingData.guest,
//                 checkIn: createBookingData.checkIn,
//                 checkOut: createBookingData.checkOut,
//                 totalPrice: bookingService.calculateTotalPrice(mockProperty.pricePerNight, createBookingData.checkIn, createBookingData.checkOut),
//                 status: 'pending',
//                 numberOfGuests: 2
//             }));
//         });
//
//         it('should throw an error if property is not found', async () => {
//             (Property.findById as jest.Mock).mockResolvedValue(null);
//
//             await expect(bookingService.createBooking(createBookingData))
//                 .rejects
//                 .toThrow(new HttpError(404, 'Property not found'));
//         });
//
//         it('should throw an error if guest is not found', async () => {
//             (Property.findById as jest.Mock).mockResolvedValue(mockProperty);
//             (User.findOne as jest.Mock).mockResolvedValue(null);
//
//             await expect(bookingService.createBooking(createBookingData))
//                 .rejects
//                 .toThrow(new HttpError(404, 'Guest not found'));
//         });
//
//         it('should throw an error if number of guests exceeds property limit', async () => {
//             (Property.findById as jest.Mock).mockResolvedValue(mockProperty);
//             (User.findOne as jest.Mock).mockResolvedValue(mockUser);
//             const data = {...createBookingData, numberOfGuests: 5};
//
//             await expect(bookingService.createBooking(data))
//                 .rejects
//                 .toThrow(new HttpError(400, 'Number of guests exceeds property limit'));
//         });
//
//         it('should throw an error if check-out date is before check-in date', async () => {
//             (Property.findById as jest.Mock).mockResolvedValue(mockProperty);
//             (User.findOne as jest.Mock).mockResolvedValue(mockUser);
//
//             const invalidDateData = {
//                 ...createBookingData,
//                 checkIn: new Date('2024-12-05'),
//                 checkOut: new Date('2024-12-01')
//             };
//
//             await expect(bookingService.createBooking(invalidDateData))
//                 .rejects
//                 .toThrow(new HttpError(400, 'Check out date should be after check in date'));
//         });
//     });
//
//     describe('getBookingById', () => {
//         it('should successfully get a booking by id', async () => {
//             (Booking.findById as jest.Mock).mockResolvedValue(mockBooking);
//
//             const result = await bookingService.getBookingById(mockBooking._id.toString());
//
//             expect(Booking.findById).toHaveBeenCalledWith(mockBooking._id.toString());
//             expect(result).toEqual(expect.objectContaining({
//                 id: mockBooking._id.toString(),
//                 property: mockBooking.property,
//                 guest: mockBooking.guest,
//                 checkIn: mockBooking.checkIn,
//                 checkOut: mockBooking.checkOut,
//                 totalPrice: mockBooking.totalPrice,
//                 status: mockBooking.status,
//                 numberOfGuests: mockBooking.numberOfGuests
//             }));
//         });
//
//         it('should throw an error if booking is not found', async () => {
//             (Booking.findById as jest.Mock).mockResolvedValue(null);
//
//             await expect(bookingService.getBookingById(mockBooking._id.toString()))
//                 .rejects
//                 .toThrow(new HttpError(404, 'Booking not found'));
//         });
//     });
//
//     describe('getBookingsWithinDateRange', () => {
//         it('should successfully get bookings within a date range', async () => {
//             const startDate = new Date('2024-12-01');
//             const endDate = new Date('2024-12-31');
//             const mockBookings = [mockBooking];
//
//             (Booking.find as jest.Mock).mockResolvedValue(mockBookings);
//
//             const result = await bookingService.getBookingsWithinDateRange(startDate, endDate);
//
//             expect(Booking.find).toHaveBeenCalledWith({
//                 checkIn: {$gte: startDate},
//                 checkOut: {$lte: endDate}
//             });
//             expect(result).toEqual(mockBookings.map(booking => expect.objectContaining({
//                 id: booking._id.toString(),
//                 property: booking.property,
//                 guest: booking.guest,
//                 checkIn: booking.checkIn,
//                 checkOut: booking.checkOut,
//                 totalPrice: booking.totalPrice,
//                 status: booking.status,
//                 numberOfGuests: booking.numberOfGuests
//             })));
//         });
//
//         it('should return an empty array if no bookings are found within the date range', async () => {
//             const startDate = new Date('2024-12-01');
//             const endDate = new Date('2024-12-31');
//
//             (Booking.find as jest.Mock).mockResolvedValue([]);
//
//             const result = await bookingService.getBookingsWithinDateRange(startDate, endDate);
//
//             expect(Booking.find).toHaveBeenCalledWith({
//                 checkIn: {$gte: startDate},
//                 checkOut: {$lte: endDate}
//             });
//             expect(result).toEqual([]);
//         });
//     });
//
//     describe('getBookingsByUserId', () => {
//         it('should successfully get bookings by user id', async () => {
//             const mockBookings = [mockBooking];
//             (Booking.find as jest.Mock).mockResolvedValue(mockBookings);
//
//             const result = await bookingService.getBookingsByUserId(mockUser._id.toString());
//
//             expect(Booking.find).toHaveBeenCalledWith({guest: mockUser._id.toString()});
//             expect(result).toEqual(mockBookings.map(booking => expect.objectContaining({
//                 id: booking._id.toString(),
//                 property: booking.property,
//                 guest: booking.guest,
//                 checkIn: booking.checkIn,
//                 checkOut: booking.checkOut,
//                 totalPrice: booking.totalPrice,
//                 status: booking.status,
//                 numberOfGuests: booking.numberOfGuests
//             })));
//         });
//     });
//
//     describe('updateBooking', () => {
//         const updateBookingData = {
//             checkIn: new Date('2024-12-01'),
//             checkOut: new Date('2024-12-05'),
//             numberOfGuests: 3
//         };
//
//         it('should successfully update a booking', async () => {
//             const updatedBooking = {
//                 ...mockBooking,
//                 ...updateBookingData,
//                 totalPrice: bookingService.calculateTotalPrice(mockProperty.pricePerNight, updateBookingData.checkIn, updateBookingData.checkOut),
//             };
//
//             (Booking.findById as jest.Mock).mockResolvedValue(mockBooking);
//
//             (Booking.findByIdAndUpdate as jest.Mock).mockResolvedValue({
//                 ...updatedBooking,
//                 toObject: () => updatedBooking
//             });
//
//             (Property.findById as jest.Mock).mockResolvedValue(mockProperty);
//
//             const result = await bookingService.updateBooking(mockBooking._id.toString(), updateBookingData);
//
//             expect(Booking.findByIdAndUpdate).toHaveBeenCalledWith(mockBooking._id.toString(), updateBookingData, {new: true});
//             expect(result).toEqual(updatedBooking);
//         });
//
//         it('should throw an error if booking is not found', async () => {
//             (Booking.findById as jest.Mock).mockResolvedValue(null);
//
//             await expect(bookingService.updateBooking(mockBooking._id.toString(), updateBookingData))
//                 .rejects
//                 .toThrow(new HttpError(404, 'Booking not found'));
//         });
//     });
//
//
// });
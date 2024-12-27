// // services/tests/booking.integration.test.ts
// import 'reflect-metadata';
// import {MongoMemoryServer} from 'mongodb-memory-server';
// import mongoose from 'mongoose';
// import {container} from 'tsyringe';
// import {BookingService} from '../booking.service';
// import {Property} from '../../models/property.model';
// import {User} from '../../models/user.model';
// import {Booking} from '../../models/booking.model';
// import {IBookingCreate, UserRole} from '../../models/interfaces';
// import {HttpError} from '../exceptions/http-error';
//
// describe('BookingService Integration Tests', () => {
//     let mongoServer: MongoMemoryServer;
//     let bookingService: BookingService;
//
//     const mockProperty = {
//         _id: new mongoose.Types.ObjectId(),
//         name: 'Test Property',
//         description: 'Test Description',
//         pricePerNight: 100,
//         maxGuests: 4,
//         available: false, // was missing
//         owner: new mongoose.Types.ObjectId(),
//         address: {
//             street: 'Test Street',
//             city: 'Test City',
//             country: 'Test Country',
//             postalCode: '12345',
//             longitude: 56.9,
//             latitude: 45.3
//         },
//         // optional fields with defaults
//         imagePaths: [],
//         amenities: [],
//         createdAt: new Date(),
//         updatedAt: new Date()
//     };
//
//     const mockUser = {
//         _id: new mongoose.Types.ObjectId(),
//         firstName: 'Test', // was missing
//         lastName: 'User', // was missing
//         email: 'test@test.com',
//         phone: '1234567890', // was missing
//         password: 'hashedpassword', // was missing
//         roles: [UserRole.USER], // was missing
//         refreshTokens: [], // was missing
//         createdAt: new Date(), // was missing
//         updatedAt: new Date() // was missing
//     };
//
//     const mockBooking = {
//         _id: new mongoose.Types.ObjectId(),
//         property: mockProperty._id,
//         guest: mockUser._id,
//         checkIn: new Date('2024-12-01'), // made more specific for date range test
//         checkOut: new Date('2024-12-02'), // made more specific for date range test
//         totalPrice: 100,
//         status: 'pending',
//         numberOfGuests: 2,
//         createdAt: new Date(),
//         updatedAt: new Date()
//     };
//
//     beforeAll(async () => {
//         mongoServer = await MongoMemoryServer.create();
//         const uri = mongoServer.getUri();
//         await mongoose.connect(uri);
//         bookingService = container.resolve(BookingService);
//     });
//
//     afterAll(async () => {
//         await mongoose.disconnect();
//         await mongoServer.stop();
//     });
//
//     beforeEach(async () => {
//         await Property.create(mockProperty);
//         await User.create(mockUser);
//         await Booking.create(mockBooking);
//     });
//
//     afterEach(async () => {
//         await mongoose.connection.dropDatabase();
//     });
//
//     it('should successfully create a booking', async () => {
//         const createBookingData: IBookingCreate = {
//             property: mockProperty._id,
//             guest: mockUser._id,
//             checkIn: new Date(),
//             checkOut: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
//             numberOfGuests: 2
//         };
//
//         const result = await bookingService.createBooking(createBookingData);
//
//         expect(result).toEqual(expect.objectContaining({
//             id: result.id, // Use the actual id from the result
//             property: createBookingData.property,
//             guest: createBookingData.guest,
//             checkIn: createBookingData.checkIn,
//             checkOut: createBookingData.checkOut,
//             totalPrice: bookingService.calculateTotalPrice(mockProperty.pricePerNight, createBookingData.checkIn, createBookingData.checkOut),
//             status: 'pending',
//             numberOfGuests: 2
//         }));
//     });
//
//
//     it('should get a booking by id', async () => {
//         const result = await bookingService.getBookingById(mockBooking._id.toString());
//
//         expect(result).toEqual(expect.objectContaining({
//             id: mockBooking._id.toString(),
//             property: expect.any(mongoose.Types.ObjectId),
//             guest: expect.any(mongoose.Types.ObjectId),
//             checkIn: mockBooking.checkIn,
//             checkOut: mockBooking.checkOut,
//             totalPrice: mockBooking.totalPrice,
//             status: mockBooking.status,
//             numberOfGuests: mockBooking.numberOfGuests
//         }));
//     });
//
//     it('should get bookings by user id', async () => {
//         const result = await bookingService.getBookingsByUserId(mockUser._id.toString());
//
//         expect(result).toEqual([
//             expect.objectContaining({
//                 id: mockBooking._id.toString(),
//                 property: mockBooking.property,
//                 guest: mockBooking.guest,
//                 checkIn: mockBooking.checkIn,
//                 checkOut: mockBooking.checkOut,
//                 totalPrice: mockBooking.totalPrice,
//                 status: mockBooking.status,
//                 numberOfGuests: mockBooking.numberOfGuests
//             })
//         ]);
//
//     });
//
//     it('should update a booking', async () => {
//         const updateBookingData = {
//             checkIn: new Date('2024-12-01'),
//             checkOut: new Date('2024-12-05'),
//             numberOfGuests: 3
//         };
//
//         const result = await bookingService.updateBooking(mockBooking._id.toString(), updateBookingData);
//
//         expect(result).toEqual(expect.objectContaining({
//             id: mockBooking._id.toString(),
//             property: mockBooking.property,
//             guest: mockBooking.guest,
//             checkIn: updateBookingData.checkIn,
//             checkOut: updateBookingData.checkOut,
//             totalPrice: bookingService.calculateTotalPrice(mockProperty.pricePerNight, updateBookingData.checkIn, updateBookingData.checkOut),
//             status: mockBooking.status,
//             numberOfGuests: updateBookingData.numberOfGuests
//         }));
//     });
//
//     it('should delete a booking', async () => {
//         const result = await bookingService.deleteBooking(mockBooking._id.toString());
//
//         expect(result).toEqual(expect.objectContaining({
//             id: mockBooking._id.toString(),
//             property: mockBooking.property,
//             guest: mockBooking.guest,
//             checkIn: mockBooking.checkIn,
//             checkOut: mockBooking.checkOut,
//             totalPrice: mockBooking.totalPrice,
//             status: mockBooking.status,
//             numberOfGuests: mockBooking.numberOfGuests
//         }));
//
//         await expect(bookingService.getBookingById(mockBooking._id.toString()))
//             .rejects
//             .toThrow(new HttpError(404, 'Booking not found'));
//     });
//
//     it('should get bookings within a date range', async () => {
//         const startDate = new Date('2024-12-01');
//         const endDate = new Date('2024-12-31');
//
//         const result = await bookingService.getBookingsWithinDateRange(startDate, endDate);
//
//         expect(result).toEqual(expect.arrayContaining([
//             expect.objectContaining({
//                 id: mockBooking._id.toString(),
//                 property: mockBooking.property,
//                 guest: mockBooking.guest,
//                 checkIn: mockBooking.checkIn,
//                 checkOut: mockBooking.checkOut,
//                 totalPrice: mockBooking.totalPrice,
//                 status: mockBooking.status,
//                 numberOfGuests: mockBooking.numberOfGuests
//             })
//         ]));
//     });
// });
// import 'reflect-metadata';
// import {MongoMemoryServer} from 'mongodb-memory-server';
// import mongoose, {Types} from 'mongoose';
// import {PropertyService} from '../property.service';
// import {Property} from '../../models/property.model';
// import {IAddress, IPropertyCreate} from '../../models/interfaces';
// import {container} from 'tsyringe';
// import dotenv from 'dotenv';
// import {Booking} from "../../models/booking.model";
// import {AmenityType, IAmenity} from "../../models/interfaces/amenity.type";
//
// // Load environment variables before all tests
// dotenv.config();
//
// // Increase timeout for all tests in this file
// jest.setTimeout(30000);
//
// describe('PropertyService Integration Tests', () => {
//     let mongoServer: MongoMemoryServer;
//     let propertyService: PropertyService;
//     let mongodb: string;
//
//     const fakeAddress: IAddress = {
//         street: 'Test Street',
//         city: 'Test City',
//         country: 'Test Country',
//         postalCode: '12345'
//     };
//
//     const createPropertyData: IPropertyCreate = {
//         name: 'Test Property',
//         description: 'Test Description',
//         pricePerNight: 100,
//         maxGuests: 4,
//         address: fakeAddress,
//         owner: new Types.ObjectId()
//     };
//
//     beforeAll(async () => {
//         // Ensure MAPBOX_ACCESS_TOKEN is available
//         if (!process.env.MAPBOX_ACCESS_TOKEN) {
//             throw new Error('MAPBOX_ACCESS_TOKEN is required for integration tests');
//         }
//
//         mongoServer = await MongoMemoryServer.create();
//         mongodb = mongoServer.getUri();
//         await mongoose.connect(mongodb);
//         propertyService = container.resolve(PropertyService);
//     });
//
//     afterAll(async () => {
//         await mongoose.disconnect();
//         await mongoServer.stop();
//     });
//
//     afterEach(async () => {
//         await Property.deleteMany({});
//     });
//
//     describe('create and retrieve operations', () => {
//
//         it('should create property with unique amenities', async () => {
//             const propertyWithAmenities: IPropertyCreate = {
//                 ...createPropertyData,
//                 amenities: [
//                     {
//                         type: AmenityType.Wifi,
//                         description: 'High-speed internet'
//                     },
//                     {
//                         type: AmenityType.Parking,
//                         description: 'Underground parking',
//                         amount: 2
//                     },
//                     {
//                         type: AmenityType.Pool,
//                         description: 'Outdoor swimming pool'
//                     }
//                 ]
//             };
//
//             const created = await propertyService.createProperty(propertyWithAmenities);
//
//             expect(created.amenities).toHaveLength(3);
//             const amenityTypes = created.amenities?.map(a => a.type);
//             expect(amenityTypes).toContain(AmenityType.Wifi);
//             expect(amenityTypes).toContain(AmenityType.Parking);
//             expect(amenityTypes).toContain(AmenityType.Pool);
//
//             // Verify the amenities are saved in database
//             const retrieved = await propertyService.getPropertyById(created.id);
//             expect(retrieved.amenities).toHaveLength(3);
//             expect(retrieved.amenities).toEqual(expect.arrayContaining(created.amenities as IAmenity[]));
//         });
//
//         it('should reject creation with duplicate amenity types', async () => {
//             const propertyWithDuplicateAmenities: IPropertyCreate = {
//                 ...createPropertyData,
//                 amenities: [
//                     {
//                         type: AmenityType.Wifi,
//                         description: 'First WiFi'
//                     },
//                     {
//                         type: AmenityType.Parking,
//                         description: 'Parking'
//                     },
//                     {
//                         type: AmenityType.Wifi,  // Duplicate type
//                         description: 'Second WiFi'
//                     }
//                 ]
//             };
//
//             await expect(propertyService.createProperty(propertyWithDuplicateAmenities))
//                 .rejects
//                 .toThrow();
//         });
//
//
//
//
//
//         it('should create property with geocoded coordinates and retrieve it', async () => {
//             const propertyWithExactAddress = {
//                 ...createPropertyData,
//                 address: {
//                     street: 'Empire State Building',
//                     city: 'New York',
//                     country: 'United States',
//                     postalCode: '10001'
//                 }
//             };
//
//             const created = await propertyService.createProperty(propertyWithExactAddress);
//
//             // Basic validation
//             expect(created.id).toBeDefined();
//             expect(created.name).toBe(propertyWithExactAddress.name);
//
//             // First verify coordinates exist
//             expect(created.address.latitude).toBeDefined();
//             expect(created.address.longitude).toBeDefined();
//
//             if (!created.address.latitude || !created.address.longitude) {
//                 fail('Coordinates were not calculated');
//             }
//
//             // Empire State Building coordinates with some tolerance
//             const EMPIRE_STATE = {
//                 latitude: 40.748467,
//                 longitude: -73.985542
//             };
//             const TOLERANCE = 0.01; // About 1km of tolerance
//
//             expect(Math.abs(created.address.latitude - EMPIRE_STATE.latitude)).toBeLessThan(TOLERANCE);
//             expect(Math.abs(created.address.longitude - EMPIRE_STATE.longitude)).toBeLessThan(TOLERANCE);
//
//             const retrieved = await propertyService.getPropertyById(created.id);
//             expect(retrieved).toEqual(created);
//         });
//
//         it('should create property with owner and retrieve by user id', async () => {
//             const userId = new Types.ObjectId().toString();
//             const created = await propertyService.createPropertyWithOwner(userId, createPropertyData);
//
//             // Verify geocoding
//             expect(created.address.latitude).toBeDefined();
//             expect(created.address.longitude).toBeDefined();
//
//             const userProperties = await propertyService.getPropertiesByUserId(userId);
//             expect(userProperties).toHaveLength(1);
//             expect(userProperties[0].id).toStrictEqual(created.id);
//         });
//     });
//
//     describe('filter operations', () => {
//         beforeEach(async () => {
//             // Create multiple properties with different characteristics
//             const property1 = await propertyService.createProperty({
//                 ...createPropertyData,
//                 maxGuests: 2,
//             });
//             await propertyService.makePropertyAvailable(property1.id);
//
//             const property2 = await propertyService.createProperty({
//                 ...createPropertyData,
//                 maxGuests: 4,
//             });
//             await propertyService.makePropertyAvailable(property2.id);
//
//             const property3 = await propertyService.createProperty({
//                 ...createPropertyData,
//                 maxGuests: 6,
//             });
//             await propertyService.makePropertyAvailable(property3.id);
//         });
//
//         it('should filter available properties by maxGuests', async () => {
//             const filter = new Map([['maxGuests', '4']]);
//             const properties = await propertyService.getAvailablePropertiesWithoutBookingsFilteredBy(filter);
//
//             expect(properties).toHaveLength(1);
//             expect(properties[0].maxGuests).toBe(4);
//             expect(properties[0].available).toBe(true);
//         });
//
//         it('should filter properties by address', async () => {
//             const property = await propertyService.createProperty({
//                 ...createPropertyData,
//                 address: fakeAddress
//             });
//             await propertyService.makePropertyAvailable(property.id);
//
//             const filter = new Map([
//                 ['address', encodeURI(JSON.stringify({
//                     city: fakeAddress.city,
//                     country: fakeAddress.country
//                 }))]
//             ]);
//
//             const properties = await propertyService.getAvailablePropertiesWithoutBookingsFilteredBy(filter);
//             expect(properties.length).toBeGreaterThan(0);
//             properties.forEach(property => {
//                 // Verify only the fields we filtered by
//                 expect(property.address.city).toEqual(fakeAddress.city);
//                 expect(property.address.country).toEqual(fakeAddress.country);
//                 expect(property.available).toBe(true);
//
//                 // Verify coordinates exist but don't check specific values
//                 expect(property.address.latitude).toBeDefined();
//                 expect(property.address.longitude).toBeDefined();
//             });
//         });
//
//         it('should filter properties with multiple criteria', async () => {
//             const filter = new Map([
//                 ['maxGuests', '4'],
//                 ['address', encodeURI(JSON.stringify({
//                     city: fakeAddress.city,
//                     country: fakeAddress.country
//                 }))]
//             ]);
//
//             const properties = await propertyService.getAvailablePropertiesWithoutBookingsFilteredBy(filter);
//             expect(properties.length).toBeGreaterThan(0);
//             properties.forEach(property => {
//                 expect(property.maxGuests).toBe(4);
//                 expect(property.address.city).toBe(fakeAddress.city);
//                 expect(property.address.country).toBe(fakeAddress.country);
//                 expect(property.available).toBe(true);
//             });
//         });
//
//         it('should return empty array when no properties match filters', async () => {
//             const filter = new Map([['maxGuests', '999']]);
//             const properties = await propertyService.getAvailablePropertiesWithoutBookingsFilteredBy(filter);
//             expect(properties).toHaveLength(0);
//         });
//     });
//
//     describe('update operations', () => {
//
//         it('should update property amenities while maintaining uniqueness', async () => {
//             // First create a property with some amenities
//             const property = await propertyService.createProperty({
//                 ...createPropertyData,
//                 amenities: [
//                     {
//                         type: AmenityType.Wifi,
//                         description: 'WiFi'
//                     }
//                 ]
//             });
//
//             // Update with new unique amenities
//             const updated = await propertyService.updateProperty(property.id, {
//                 amenities: [
//                     {
//                         type: AmenityType.Pool,
//                         description: 'Indoor pool'
//                     },
//                     {
//                         type: AmenityType.Gym,
//                         description: 'Fitness center',
//                         amount: 1
//                     }
//                 ]
//             });
//
//             expect(updated.amenities).toHaveLength(2);
//             const updatedTypes = updated.amenities?.map(a => a.type);
//             expect(updatedTypes).toContain(AmenityType.Pool);
//             expect(updatedTypes).toContain(AmenityType.Gym);
//             expect(updatedTypes).not.toContain(AmenityType.Wifi);
//         });
//
//         it('should reject update with duplicate amenity types', async () => {
//             const property = await propertyService.createProperty(createPropertyData);
//
//             await expect(propertyService.updateProperty(property.id, {
//                 amenities: [
//                     {
//                         type: AmenityType.Pool,
//                         description: 'Indoor pool'
//                     },
//                     {
//                         type: AmenityType.Pool,  // Duplicate type
//                         description: 'Outdoor pool'
//                     }
//                 ]
//             })).rejects.toThrow();
//         });
//
//         it('should update property address and recalculate coordinates', async () => {
//             const property = await propertyService.createProperty(createPropertyData);
//             const originalCoords = {
//                 latitude: property.address.latitude,
//                 longitude: property.address.longitude
//             };
//
//             const updateData = {
//                 address: {
//                     street: '1600 Pennsylvania Avenue NW',
//                     city: 'Washington',
//                     country: 'USA',
//                     postalCode: '20500'
//                 }
//             };
//
//             const updated = await propertyService.updateProperty(property.id, updateData);
//
//             // Verify new coordinates were calculated and are different
//             expect(updated.address.latitude).not.toBe(originalCoords.latitude);
//             expect(updated.address.longitude).not.toBe(originalCoords.longitude);
//
//             // Verify coordinates are within reasonable bounds for DC
//             expect(updated.address.latitude).toBeGreaterThan(38);
//             expect(updated.address.latitude).toBeLessThan(39);
//             expect(updated.address.longitude).toBeGreaterThan(-78);
//             expect(updated.address.longitude).toBeLessThan(-76);
//         });
//
//         describe('date filtering with bookings', () => {
//             let existingProperty: any;
//             let checkInDate: Date;
//             let checkOutDate: Date;
//
//             beforeEach(async () => {
//                 // Create and make available a property
//                 existingProperty = await propertyService.createProperty(createPropertyData);
//                 await propertyService.makePropertyAvailable(existingProperty.id);
//
//                 // Set up test dates
//                 checkInDate = new Date('2024-07-10');
//                 checkOutDate = new Date('2024-07-15');
//             });
//
//             it('should filter out properties with overlapping pending bookings', async () => {
//                 // Create several booking scenarios
//                 const bookingScenarios = [
//                     // Scenario 1: Booking entirely within requested period
//                     {
//                         checkIn: new Date('2024-07-11'),
//                         checkOut: new Date('2024-07-13')
//                     },
//                     // Scenario 2: Booking starts before and ends during
//                     {
//                         checkIn: new Date('2024-07-08'),
//                         checkOut: new Date('2024-07-12')
//                     },
//                     // Scenario 3: Booking starts during and ends after
//                     {
//                         checkIn: new Date('2024-07-13'),
//                         checkOut: new Date('2024-07-17')
//                     },
//                     // Scenario 4: Booking encompasses entire period
//                     {
//                         checkIn: new Date('2024-07-09'),
//                         checkOut: new Date('2024-07-16')
//                     }
//                 ];
//
//                 // Create bookings for each scenario on different properties
//                 for (const scenario of bookingScenarios) {
//                     const property = await propertyService.createProperty(createPropertyData);
//                     await propertyService.makePropertyAvailable(property.id);
//
//                     // Create a pending booking
//                     await Booking.create({
//                         property: property.id,
//                         guest: new Types.ObjectId(),
//                         checkIn: scenario.checkIn,
//                         checkOut: scenario.checkOut,
//                         numberOfGuests: 2,
//                         status: 'pending',
//                         totalPrice: 100
//                     });
//                 }
//
//                 // Create one property with non-overlapping booking
//                 const availableProperty = await propertyService.createProperty(createPropertyData);
//                 await propertyService.makePropertyAvailable(availableProperty.id);
//                 await Booking.create({
//                     property: availableProperty.id,
//                     guest: new Types.ObjectId(),
//                     checkIn: new Date('2024-07-05'),
//                     checkOut: new Date('2024-07-08'), // Ends before requested period
//                     numberOfGuests: 2,
//                     status: 'pending',
//                     totalPrice: 100
//                 });
//
//                 // Also create a property with cancelled booking during the period
//                 const propertyWithCancelledBooking = await propertyService.createProperty(createPropertyData);
//                 await propertyService.makePropertyAvailable(propertyWithCancelledBooking.id);
//                 await Booking.create({
//                     property: propertyWithCancelledBooking.id,
//                     guest: new Types.ObjectId(),
//                     checkIn: new Date('2024-07-11'),
//                     checkOut: new Date('2024-07-13'),
//                     numberOfGuests: 2,
//                     status: 'cancelled',
//                     totalPrice: 100
//                 });
//
//                 // Filter properties with the date range
//                 const filter = new Map([
//                     ['checkIn', checkInDate.toISOString()],
//                     ['checkOut', checkOutDate.toISOString()]
//                 ]);
//
//                 const availableProperties = await propertyService.getAvailablePropertiesWithoutBookingsFilteredBy(filter);
//
//                 // We should only get:
//                 // 1. The property with non-overlapping booking
//                 // 2. The property with cancelled booking
//                 // 3. The original property from beforeEach with no bookings
//                 expect(availableProperties).toHaveLength(3);
//
//                 // Verify the properties returned are the ones we expect
//                 const availablePropertyIds = availableProperties.map(p => p.id);
//                 expect(availablePropertyIds).toContainEqual(availableProperty.id);
//                 expect(availablePropertyIds).toContainEqual(propertyWithCancelledBooking.id);
//                 expect(availablePropertyIds).toContainEqual(existingProperty.id);
//             });
//         });
//     });
//
//     describe('delete operations', () => {
//         it('should delete property', async () => {
//             const property = await propertyService.createProperty(createPropertyData);
//             await propertyService.deleteProperty(property.id);
//
//             await expect(propertyService.getPropertyById(property.id))
//                 .rejects
//                 .toThrow('Property not found');
//         });
//     });
// });
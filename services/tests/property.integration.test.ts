import 'reflect-metadata';
import {MongoMemoryServer} from 'mongodb-memory-server';
import mongoose, {Types} from 'mongoose';
import {PropertyService} from '../property.service';
import {Property} from '../../models/property.model';
import {IAddress, IPropertyCreate} from '../../models/interfaces';
import {container} from 'tsyringe';

describe('PropertyService Integration Tests', () => {
    let mongoServer: MongoMemoryServer;
    let propertyService: PropertyService;
    let mongodb: string;

    const mockAddress: IAddress = {
        street: 'Test Street',
        city: 'Test City',
        country: 'Test Country',
        postalCode: '12345'
    };

    const createPropertyData: IPropertyCreate = {
        name: 'Test Property',
        description: 'Test Description',
        pricePerNight: 100,
        maxGuests: 4,
        address: mockAddress,
        owner: new Types.ObjectId()
    };

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        mongodb = mongoServer.getUri();
        await mongoose.connect(mongodb);
        propertyService = container.resolve(PropertyService);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    afterEach(async () => {
        await Property.deleteMany({});
    });

    describe('create and retrieve operations', () => {
        it('should create and retrieve a property', async () => {
            const created = await propertyService.createProperty(createPropertyData);
            expect(created.id).toBeDefined();
            expect(created.name).toBe(createPropertyData.name);

            const retrieved = await propertyService.getPropertyById(created.id);
            expect(retrieved).toEqual(created);
        });

        it('should create property with owner and retrieve by user id', async () => {
            const userId = new Types.ObjectId().toString();
            const created = await propertyService.createPropertyWithOwner(userId, createPropertyData);

            const userProperties = await propertyService.getPropertiesByUserId(userId);
            expect(userProperties).toHaveLength(1);
            expect(userProperties[0].id).toStrictEqual(created.id);
        });
    });

    describe('filter operations', () => {
        beforeEach(async () => {
            // Create multiple properties with different characteristics
            const property1 = await propertyService.createProperty({
                ...createPropertyData,
                maxGuests: 2,
            });
            await propertyService.makePropertyAvailable(property1.id);

            const property2 = await propertyService.createProperty({
                ...createPropertyData,
                maxGuests: 4,
            });
            await propertyService.makePropertyAvailable(property2.id);

            const property3 = await propertyService.createProperty({
                ...createPropertyData,
                maxGuests: 6,
            });
            await propertyService.makePropertyAvailable(property3.id);
        });

        it('should filter available properties by maxGuests', async () => {
            const filter = new Map([['maxGuests', '4']]);
            const properties = await propertyService.getAvailablePropertiesWithoutBookingsFilteredBy(filter);

            expect(properties).toHaveLength(1);
            expect(properties[0].maxGuests).toBe(4);
            expect(properties[0].available).toBe(true);
        });

        it('should filter properties by address', async () => {
            const property = await propertyService.createProperty({
                ...createPropertyData,
                address: mockAddress
            });
            await propertyService.makePropertyAvailable(property.id);

            const filter = new Map([
                ['address', encodeURI(JSON.stringify(mockAddress))]
            ]);

            const properties = await propertyService.getAvailablePropertiesWithoutBookingsFilteredBy(filter);
            expect(properties.length).toBeGreaterThan(0);
            properties.forEach(property => {
                expect(property.address).toEqual(mockAddress);
                expect(property.available).toBe(true);
            });
        });

        it('should filter properties with multiple criteria', async () => {
            const filter = new Map([
                ['maxGuests', '4'],
                ['address', encodeURI(JSON.stringify({
                    city: mockAddress.city,
                    country: mockAddress.country
                }))]
            ]);

            const properties = await propertyService.getAvailablePropertiesWithoutBookingsFilteredBy(filter);
            expect(properties.length).toBeGreaterThan(0);
            properties.forEach(property => {
                expect(property.maxGuests).toBe(4);
                expect(property.address.city).toBe(mockAddress.city);
                expect(property.address.country).toBe(mockAddress.country);
                expect(property.available).toBe(true);
            });
        });

        it('should return empty array when no properties match filters', async () => {
            const filter = new Map([['maxGuests', '999']]);
            const properties = await propertyService.getAvailablePropertiesWithoutBookingsFilteredBy(filter);
            expect(properties).toHaveLength(0);
        });
    });
    describe('update operations', () => {
        it('should make property available', async () => {
            const property = await propertyService.createProperty(createPropertyData);
            expect(property.available).toBeFalsy();

            const updated = await propertyService.makePropertyAvailable(property.id);
            expect(updated.available).toBe(true);

            const retrieved = await propertyService.getPropertyById(property.id);
            expect(retrieved.available).toBe(true);
        });

        it('should update property details', async () => {
            const property = await propertyService.createProperty(createPropertyData);
            const updateData = {
                pricePerNight: 200,
                description: 'Updated description'
            };

            const updated = await propertyService.updateProperty(property.id, updateData);
            expect(updated.pricePerNight).toBe(updateData.pricePerNight);
            expect(updated.description).toBe(updateData.description);
        });
    });

    describe('delete operations', () => {
        it('should delete property', async () => {
            const property = await propertyService.createProperty(createPropertyData);
            await propertyService.deleteProperty(property.id);

            await expect(propertyService.getPropertyById(property.id))
                .rejects
                .toThrow('Property not found');
        });
    });
});
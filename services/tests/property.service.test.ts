import "reflect-metadata";
import {PropertyService} from '../property.service';
import {Property} from '../../models/property.model';
import {IAddress, IPropertyCreate} from '../../models/interfaces';
import {container} from 'tsyringe';
import {Types} from 'mongoose';
import {HttpError} from "../exceptions/http-error";
import {GeocodingService} from '../geocoding.service';

// Mock the Property model
jest.mock('../../models/property.model');

// Create a mock implementation that matches GeocodingService interface
const mockGeocodingService = {
    getCoordinates: jest.fn().mockResolvedValue({
        latitude: 40.7128,
        longitude: -74.0060
    })
} as unknown as GeocodingService;

// Mock the GeocodingService module
jest.mock('../geocoding.service', () => ({
    GeocodingService: jest.fn().mockImplementation(() => mockGeocodingService)
}));

describe('PropertyService', () => {
    let propertyService: PropertyService;
    let geocodingService: GeocodingService;

    const mockAddress: IAddress = {
        street: 'Test Street',
        city: 'Test City',
        country: 'Test Country',
        postalCode: '12345'
    };

    const mockProperty = {
        _id: new Types.ObjectId(),
        name: 'Test Property',
        description: 'Test Description',
        pricePerNight: 100,
        maxGuests: 4,
        owner: new Types.ObjectId(),
        address: {
            ...mockAddress,
            latitude: 40.7128,
            longitude: -74.0060
        },
        available: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        toObject: jest.fn()
    };

    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();

        // Reset the container and register mocked services
        container.clearInstances();

        // Register mock geocoding service
        container.registerInstance(GeocodingService, mockGeocodingService);

        // Resolve the property service
        propertyService = container.resolve(PropertyService);

        // Get the geocoding service instance
        geocodingService = container.resolve(GeocodingService);

        // Setup default mock return values
        mockProperty.toObject.mockReturnValue({...mockProperty, id: mockProperty._id.toString()});
    });

    describe('create operations', () => {
        const createPropertyData: IPropertyCreate = {
            name: 'Test Property',
            description: 'Test Description',
            pricePerNight: mockProperty.pricePerNight,
            maxGuests: mockProperty.maxGuests,
            address: mockAddress,
            owner: new Types.ObjectId()
        };

        it('should create a property with geocoded coordinates', async () => {
            (Property.create as jest.Mock).mockResolvedValue(mockProperty);

            const result = await propertyService.createProperty(createPropertyData);

            expect(geocodingService.getCoordinates).toHaveBeenCalledWith(createPropertyData.address);
            expect(Property.create).toHaveBeenCalledWith({
                ...createPropertyData,
                address: {
                    ...createPropertyData.address,
                    latitude: 40.7128,
                    longitude: -74.0060
                }
            });
            expect(result).toMatchObject({
                id: expect.any(String),
                name: createPropertyData.name,
                address: expect.objectContaining({
                    latitude: mockProperty.address.latitude,
                    longitude: mockProperty.address.longitude
                })
            });
        });

        it('should handle geocoding service errors when creating property', async () => {
            // Set up the mock to reject with an HttpError
            (mockGeocodingService.getCoordinates as jest.Mock).mockRejectedValueOnce(
                new HttpError(500, 'Geocoding service error')
            );

            await expect(propertyService.createProperty(createPropertyData))
                .rejects
                .toThrow('Geocoding service error');

            expect(Property.create).not.toHaveBeenCalled();
        });

        it('should create a property with owner and geocoded coordinates', async () => {
            const userId = new Types.ObjectId().toString();
            (Property.create as jest.Mock).mockResolvedValue(mockProperty);

            const result = await propertyService.createPropertyWithOwner(userId, createPropertyData);

            expect(geocodingService.getCoordinates).toHaveBeenCalledWith(createPropertyData.address);
            expect(Property.create).toHaveBeenCalledWith({
                ...createPropertyData,
                owner: userId,
                address: {
                    ...createPropertyData.address,
                    latitude: mockProperty.address.latitude,
                    longitude: mockProperty.address.longitude
                }
            });
            expect(result.owner.toString()).toBeDefined();
        });
    });

    describe('availability operations', () => {
        it('should make a property available', async () => {
            const updatedMockProperty = {...mockProperty, available: true};
            (Property.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedMockProperty);
            updatedMockProperty.toObject.mockReturnValue({
                ...updatedMockProperty,
                id: updatedMockProperty._id.toString()
            });

            const result = await propertyService.makePropertyAvailable(mockProperty._id.toString());

            expect(Property.findByIdAndUpdate).toHaveBeenCalledWith(
                mockProperty._id.toString(),
                {available: true},
                {new: true}
            );
            expect(result.available).toBe(true);
        });

        it('should throw error when making non-existent property available', async () => {
            (Property.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

            await expect(propertyService.makePropertyAvailable(mockProperty._id.toString()))
                .rejects
                .toThrow(HttpError);
        });
    });

    describe('get operations', () => {
        it('should return all available properties', async () => {
            const mockAvailableProperty = {
                ...mockProperty,
                available: true,
                toObject: jest.fn().mockReturnValue({
                    ...mockProperty,
                    id: mockProperty._id.toString(),
                    available: true
                })
            };

            const mockProperties = [mockAvailableProperty];
            (Property.find as jest.Mock).mockResolvedValue(mockProperties);

            const result = await propertyService.getAllAvailableProperties();

            expect(Property.find).toHaveBeenCalledWith({available: true});
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                id: expect.any(String),
                available: true
            });
        });

        it('should return available properties with filters', async () => {
            const mockAvailableProperty = {
                ...mockProperty,
                available: true,
                toObject: jest.fn().mockReturnValue({
                    ...mockProperty,
                    id: mockProperty._id.toString(),
                    available: true
                })
            };

            const mockProperties = [mockAvailableProperty];
            (Property.find as jest.Mock).mockResolvedValue(mockProperties);

            const filter = new Map([
                ['maxGuests', '4'],
                ['address', encodeURI(JSON.stringify(mockAddress))]
            ]);

            const result = await propertyService.getAvailablePropertiesWithoutBookingsFilteredBy(filter);

            expect(Property.find).toHaveBeenCalledWith({
                available: true,
                maxGuests: 4,
                'address.street': mockAddress.street,
                'address.city': mockAddress.city,
                'address.country': mockAddress.country,
                'address.postalCode': mockAddress.postalCode
            });

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                id: expect.any(String),
                available: true,
                maxGuests: 4
            });
        });

        it('should throw error with invalid address format in filter', async () => {
            const filter = new Map([
                ['address', 'invalid-json']
            ]);

            await expect(propertyService.getAvailablePropertiesWithoutBookingsFilteredBy(filter))
                .rejects
                .toThrow('Invalid address format');
        });
    });

    describe('update operations', () => {
        it('should update property address with new coordinates', async () => {
            const newLatitude = 35.6895;
            const newLongitude = -72.0060;

            // Update the mock for this specific test
            (mockGeocodingService.getCoordinates as jest.Mock).mockResolvedValueOnce({
                latitude: newLatitude,
                longitude: newLongitude
            });

            const updateData = {
                address: {
                    street: 'New Street',
                    city: 'New City',
                    country: 'New Country',
                    postalCode: '54321'
                }
            };

            const updatedMockProperty = {
                ...mockProperty,
                address: {
                    ...updateData.address,
                    latitude: newLatitude,
                    longitude: newLongitude
                }
            };

            (Property.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedMockProperty);
            updatedMockProperty.toObject.mockReturnValue({
                ...updatedMockProperty,
                id: updatedMockProperty._id.toString()
            });

            const result = await propertyService.updateProperty(
                mockProperty._id.toString(),
                updateData
            );

            expect(geocodingService.getCoordinates).toHaveBeenCalledWith(updateData.address);
            expect(result.address).toEqual(expect.objectContaining({
                ...updateData.address,
                latitude: newLatitude,
                longitude: newLongitude
            }));
        });

        it('should not call geocoding service when updating non-address fields', async () => {
            const updateData = {pricePerNight: 200};
            const updatedMockProperty = {...mockProperty, ...updateData};

            (Property.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedMockProperty);
            updatedMockProperty.toObject.mockReturnValue({
                ...updatedMockProperty,
                id: updatedMockProperty._id.toString()
            });

            await propertyService.updateProperty(mockProperty._id.toString(), updateData);

            expect(geocodingService.getCoordinates).not.toHaveBeenCalled();
        });

        it('should throw error when updating non-existent property', async () => {
            (Property.findByIdAndUpdate as jest.Mock).mockResolvedValue(null);

            await expect(propertyService.updateProperty(mockProperty._id.toString(), {pricePerNight: 200}))
                .rejects
                .toThrow(HttpError);
        });

    });

    describe('delete operations', () => {
        it('should delete property', async () => {
            (Property.findByIdAndDelete as jest.Mock).mockResolvedValue(mockProperty);

            const result = await propertyService.deleteProperty(mockProperty._id.toString());
            expect(Property.findByIdAndDelete).toHaveBeenCalledWith(mockProperty._id.toString());
            expect(result).toBeDefined();
        });

        it('should throw error when deleting non-existent property', async () => {
            (Property.findByIdAndDelete as jest.Mock).mockResolvedValue(null);

            await expect(propertyService.deleteProperty(mockProperty._id.toString()))
                .rejects
                .toThrow(HttpError);
        });
    });
});
import "reflect-metadata";
import {PropertyService} from '../property.service';
import {Property} from '../../models/property.model';
import {IAddress, IPropertyCreate} from '../../models/interfaces';
import {container} from 'tsyringe';
import {Types} from 'mongoose';
import {HttpError} from "../exceptions/http-error";

jest.mock('../../models/property.model');

describe('PropertyService', () => {
    let propertyService: PropertyService;
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
        address: mockAddress,
        available: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        toObject: jest.fn()
    };

    beforeAll(() => {
        propertyService = container.resolve(PropertyService);
        mockProperty.toObject.mockReturnValue({...mockProperty, id: mockProperty._id.toString()});
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create operations', () => {
        const createPropertyData: IPropertyCreate = {
            name: 'Test Property',
            description: 'Test Description',
            pricePerNight: 100,
            maxGuests: 4,
            address: mockAddress,
            owner: new Types.ObjectId()
        };

        it('should create a property', async () => {
            (Property.create as jest.Mock).mockResolvedValue(mockProperty);
            const result = await propertyService.createProperty(createPropertyData);
            expect(Property.create).toHaveBeenCalledWith(createPropertyData);
            expect(result).toEqual(expect.objectContaining({
                id: expect.any(String),
                name: createPropertyData.name,
                description: createPropertyData.description,
                pricePerNight: createPropertyData.pricePerNight,
                maxGuests: createPropertyData.maxGuests,
                address: createPropertyData.address
            }));
        });

        it('should create a property with owner', async () => {
            const userId = new Types.ObjectId().toString();
            (Property.create as jest.Mock).mockResolvedValue(mockProperty);
            const result = await propertyService.createPropertyWithOwner(userId, createPropertyData);
            expect(Property.create).toHaveBeenCalledWith({
                ...createPropertyData,
                owner: userId
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
        it('should return all properties', async () => {
            const mockProperties = [mockProperty];
            (Property.find as jest.Mock).mockResolvedValue(mockProperties);

            const result = await propertyService.getAllProperties();
            expect(Property.find).toHaveBeenCalled();
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(expect.objectContaining({
                id: expect.any(String),
                name: mockProperty.name
            }));
        });

        it('should return all available properties', async () => {
            const mockProperties = [{...mockProperty, available: true}];
            (Property.find as jest.Mock).mockResolvedValue(mockProperties);

            const result = await propertyService.getAllAvailableProperties();
            expect(Property.find).toHaveBeenCalledWith({available: true});
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(expect.objectContaining({
                id: expect.any(String),
                available: true
            }));
        });

        it('should return properties by user id', async () => {
            const userId = new Types.ObjectId().toString();
            const mockProperties = [mockProperty];
            (Property.find as jest.Mock).mockResolvedValue(mockProperties);

            const result = await propertyService.getPropertiesByUserId(userId);
            expect(Property.find).toHaveBeenCalledWith({owner: userId});
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(expect.objectContaining({
                id: expect.any(String),
                owner: mockProperty.owner
            }));
        });

        it('should return available properties with filters', async () => {
            const mockProperties = [{...mockProperty, available: true}];
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
            expect(result[0]).toEqual(expect.objectContaining({
                id: expect.any(String),
                available: true,
                maxGuests: mockProperty.maxGuests
            }));
        });

        it('should return property by id', async () => {
            (Property.findById as jest.Mock).mockResolvedValue(mockProperty);
            const propertyId = new Types.ObjectId().toString();

            const result = await propertyService.getPropertyById(propertyId);
            expect(Property.findById).toHaveBeenCalledWith(propertyId);
            expect(result).toEqual(expect.objectContaining({
                id: expect.any(String),
                name: mockProperty.name
            }));
        });

        it('should throw error when property not found by id', async () => {
            (Property.findById as jest.Mock).mockResolvedValue(null);
            const propertyId = new Types.ObjectId().toString();

            await expect(propertyService.getPropertyById(propertyId))
                .rejects
                .toThrow(HttpError);
        });
    });

    describe('update operations', () => {
        it('should update property', async () => {
            const updateData = {pricePerNight: 200};
            const updatedMockProperty = {...mockProperty, ...updateData};
            (Property.findByIdAndUpdate as jest.Mock).mockResolvedValue(updatedMockProperty);
            updatedMockProperty.toObject.mockReturnValue({
                ...updatedMockProperty,
                id: updatedMockProperty._id.toString()
            });

            const result = await propertyService.updateProperty(mockProperty._id.toString(), updateData);
            expect(Property.findByIdAndUpdate).toHaveBeenCalledWith(
                mockProperty._id.toString(),
                updateData,
                {new: true}
            );
            expect(result.pricePerNight).toBe(updateData.pricePerNight);
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
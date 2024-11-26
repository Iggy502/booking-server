import "reflect-metadata";
import {PropertyService} from '../property.service';
import {Property} from '../../models/property.model';
import {IPropertyCreate, IPropertyResponse, IAddress} from '../../models/interfaces';
import {container} from 'tsyringe';
import {Types} from 'mongoose';
import {HttpError} from "../../exceptions/http-error";

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
            address: mockAddress
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

    describe('get operations', () => {
        it('should return filtered properties with address filter', async () => {
            const mockProperties = [mockProperty];
            (Property.find as jest.Mock).mockResolvedValue(mockProperties);

            const filter = new Map([
                ['address', encodeURI(JSON.stringify(mockAddress))]
            ]);

            const result = await propertyService.getAllPropertiesFilteredBy(filter);
            expect(Property.find).toHaveBeenCalledWith({
                address: mockAddress
            });
            expect(result[0]).toEqual(expect.objectContaining({
                id: expect.any(String),
                address: mockAddress
            }));
        });

        describe('get operations', () => {
            //TODO: Remove hardcoded values when expecting the exact values
            it('should return properties without bookings', async () => {
                const mockAggregateResponse = [{
                    _id: mockProperty._id,
                    name: mockProperty.name,
                    description: mockProperty.description,
                    pricePerNight: mockProperty.pricePerNight,
                    maxGuests: 4,
                    owner: mockProperty.owner,
                    address: mockAddress,
                    createdAt: mockProperty.createdAt,
                    updatedAt: mockProperty.updatedAt
                }];

                (Property.aggregate as jest.Mock).mockResolvedValue(mockAggregateResponse);
                (Property.hydrate as jest.Mock).mockReturnValue({
                    ...mockProperty,
                    toObject: jest.fn().mockReturnValue({
                        ...mockProperty,
                        id: mockProperty._id.toString(),
                        _id: undefined
                    })
                });

                const filter = new Map([
                    ['maxGuests', '4']
                ]);

                const responses = await propertyService.getPropertiesWithoutBookingsFilteredBy(filter);

                expect(responses).toHaveLength(1);
                expect(responses[0]).toEqual(expect.objectContaining({
                    id: expect.any(String),
                    name: mockProperty.name,
                    description: mockProperty.description,
                    pricePerNight: mockProperty.pricePerNight,
                    maxGuests: mockProperty.maxGuests,
                    address: mockProperty.address
                }));

                expect(Property.aggregate).toHaveBeenCalledWith([
                    {
                        $lookup: {
                            from: 'bookings',
                            localField: '_id',
                            foreignField: 'property',
                            as: 'bookings'
                        }
                    },
                    {
                        $match: {
                            'bookings.0': {$exists: false},
                            maxGuests: mockProperty.maxGuests.toString()
                        }
                    },
                    {
                        $project: {
                            bookings: 0
                        }
                    }
                ]);

                expect(Property.hydrate).toHaveBeenCalledWith(mockAggregateResponse[0]);
            });
        });

        it('should return property by id', async () => {
            (Property.findById as jest.Mock).mockResolvedValue(mockProperty);
            const propertyId = new Types.ObjectId().toString();

            const result = await propertyService.getPropertyById(propertyId);
            expect(Property.findById).toHaveBeenCalledWith(propertyId);
            expect(result).toEqual(expect.objectContaining({
                id: expect.any(String),
                name: mockProperty.name,
                description: mockProperty.description,
                pricePerNight: mockProperty.pricePerNight,
                maxGuests: mockProperty.maxGuests,
                address: mockProperty.address
            }));
        });

        it('should handle property filter variations', async () => {
            const filter = new Map();

            (Property.find as jest.Mock).mockResolvedValue([mockProperty]);

            const spyFiltered = jest.spyOn(propertyService, 'getAllPropertiesFilteredBy');
            const spyWithoutBookings = jest.spyOn(propertyService, 'getPropertiesWithoutBookingsFilteredBy');

            await propertyService.getPropertiesWithFilter(true, filter);
            expect(spyWithoutBookings).toHaveBeenCalled();

            await propertyService.getPropertiesWithFilter(false, filter);
            expect(spyFiltered).toHaveBeenCalled();

        });

        it('should throw an error for invalid filter keys', async () => {
            const filter = new Map([
                ['invalidKey', 'someValue']
            ]);

            await expect(propertyService.getAllPropertiesFilteredBy(filter))
                .rejects
                .toThrow(HttpError);

            expect(Property.find).not.toHaveBeenCalled();
        });
        it('empty filters should result in all properties being returned', async () => {
            const mockProperties = [mockProperty];
            (Property.find as jest.Mock).mockResolvedValue(mockProperties);
            const getAll = jest.spyOn(propertyService, 'getAllProperties');

            const result = await propertyService.getAllPropertiesFilteredBy(new Map());
            expect(Property.find).toHaveBeenCalled();
            expect(getAll).toHaveBeenCalled();
            expect(result).toEqual(expect.arrayContaining([expect.objectContaining({
                id: expect.any(String),
                name: mockProperty.name,
                description: mockProperty.description,
                pricePerNight: mockProperty.pricePerNight,
                maxGuests: mockProperty.maxGuests,
                address: mockProperty.address
            })]));
        });
    });

    describe('update operations', () => {
        it('should update property', async () => {
            const updateData: Partial<IPropertyCreate> = {pricePerNight: 200};
            (Property.findByIdAndUpdate as jest.Mock).mockResolvedValue(mockProperty);

            const result = await propertyService.updateProperty(mockProperty._id.toString(), updateData);
            expect(Property.findByIdAndUpdate).toHaveBeenCalledWith(
                mockProperty._id.toString(),
                updateData,
                {new: true}
            );
            expect(result).toBeDefined();
        });
    });

    describe('delete operations', () => {
        it('should delete property', async () => {
            (Property.findByIdAndDelete as jest.Mock).mockResolvedValue(mockProperty);

            const result = await propertyService.deleteProperty(mockProperty._id.toString());
            expect(Property.findByIdAndDelete).toHaveBeenCalledWith(mockProperty._id.toString());
            expect(result).toBeDefined();
        });
    });
});
//Property service to handle property operations
import {Property} from '../models/property.model';
import {IPropertyCreate, IPropertyDocument, IPropertyResponse, IPropertyUpdate} from '../models/interfaces';
import {container, injectable} from 'tsyringe';
import {HttpError} from "./exceptions/http-error";
import {GeocodingService} from "./geocoding.service";
import {Booking} from "../models/booking.model";
import {exists} from "node:fs";
import {BadRequest, InternalServerError, NotFound} from "http-errors";

@injectable()
export class PropertyService {

    private geocodingService: GeocodingService;

    constructor() {
        this.geocodingService = container.resolve(GeocodingService);
    }

    async createProperty(propertyData: IPropertyCreate): Promise<IPropertyResponse> {
        try {
            const coordinates = await this.geocodingService.getCoordinates(propertyData.address);

            const propertyWithCoordinates = {
                ...propertyData,
                address: {
                    ...propertyData.address,
                    ...coordinates
                }
            };

            const property = await Property.create(propertyWithCoordinates);
            return this.mapToPropertyResponse(property);
        } catch (error) {
            throw InternalServerError('Failed to create property');
        }
    }

    async createPropertyWithOwner(userId: string, propertyData: IPropertyCreate): Promise<IPropertyResponse> {
        try {
            const coordinates = await this.geocodingService.getCoordinates(propertyData.address);

            const propertyWithCoordinates = {
                ...propertyData,
                owner: userId,
                address: {
                    ...propertyData.address,
                    ...coordinates
                }
            };

            const property = await Property.create(propertyWithCoordinates);
            return this.mapToPropertyResponse(property);
        } catch (error) {
            if (error instanceof HttpError) {
                throw error;
            }
            throw new InternalServerError('Failed to create property');
        }
    }

    async makePropertyAvailable(propertyId: string): Promise<IPropertyResponse> {
        const property = await Property.findByIdAndUpdate(propertyId, {available: true}, {new: true});

        if (!property) {
            throw new NotFound('Property not found');
        }

        return this.mapToPropertyResponse(property);
    }

    private mapToPropertyResponse(property: IPropertyDocument): IPropertyResponse {
        return <IPropertyResponse>property.toObject();
    }

    async getAllProperties(): Promise<IPropertyResponse[]> {
        const properties = await Property.find({available: true});
        return properties.map(property => this.mapToPropertyResponse(property));
    }

    async getAllAvailableProperties(): Promise<IPropertyResponse[]> {
        const properties = await Property.find({available: true});
        return properties.map(property => this.mapToPropertyResponse(property));
    }

    async verifyNoOverlappingBookings(propertyId: string, checkIn: Date, checkOut: Date): Promise<boolean> {

        if (!Property.exists({_id: propertyId})) {
            throw NotFound('Property not found');
        }

        return !(await Booking.exists({
            property: propertyId,
            status: 'pending',
            $or: [
                {
                    checkIn: {$lt: checkOut},
                    checkOut: {$gt: checkIn}
                },
                {
                    checkIn: {$gte: checkIn, $lt: checkOut}
                }
            ]
        }));
    }

    async getAvailablePropertiesWithoutBookingsFilteredBy(filter: Map<string, string>): Promise<IPropertyResponse[]> {
        const matchConditions: { [key: string]: any } = {
            available: true
        };

        let checkIn: Date | undefined;
        let checkOut: Date | undefined;

        filter?.forEach((value, key) => {
            if (key === 'address') {
                try {
                    const addressObj = JSON.parse(decodeURI(value));
                    Object.entries(addressObj).forEach(([addressKey, addressValue]) => {
                        matchConditions[`address.${addressKey}`] = addressValue;
                    });
                } catch (error) {
                    console.error('Error parsing address:', error);
                    throw new NotFound('Invalid address format');
                }
            } else if (key === 'maxGuests') {
                matchConditions[key] = parseInt(value, 10);
            } else if (key === 'pricePerNight') {
                matchConditions[key] = parseFloat(value);
            } else if (key === 'checkIn') {
                checkIn = new Date(value);
                if (isNaN(checkIn.getTime())) {
                    throw BadRequest('Invalid checkIn date format');
                }
            } else if (key === 'checkOut') {
                checkOut = new Date(value);
                if (isNaN(checkOut.getTime())) {
                    throw BadRequest('Invalid checkOut date format');
                }
            } else {
                console.error('Invalid filter key:', key);
            }
        });

        if (checkIn && checkOut) {
            const bookedPropertyIds = await Booking.distinct('property', {
                status: 'pending',
                $or: [
                    {
                        checkIn: {$lt: checkOut},
                        checkOut: {$gt: checkIn}
                    },
                    {
                        checkIn: {$gte: checkIn, $lt: checkOut}
                    }
                ]
            });

            if (bookedPropertyIds.length > 0) {
                matchConditions._id = {$nin: bookedPropertyIds};
            }
        }

        const properties = await Property.find(matchConditions);
        return properties.map(property => this.mapToPropertyResponse(property));
    }

    async getPropertyById(propertyId: string): Promise<IPropertyResponse> {
        const property = await Property.findById(propertyId);

        if (!property) {
            throw new NotFound('Property not found');
        }

        return this.mapToPropertyResponse(property);
    }

    async updateProperty(propertyId: string, propertyData: IPropertyUpdate): Promise<IPropertyResponse> {
        try {
            let updateData = {...propertyData};

            // If address is being updated, get new coordinates
            if (propertyData.address) {
                const coordinates = await this.geocodingService.getCoordinates(propertyData.address);
                updateData = {
                    ...updateData,
                    address: {
                        ...propertyData.address,
                        ...coordinates
                    }
                };
            }

            const property = await Property.findByIdAndUpdate(propertyId, updateData, {new: true});

            if (!property) {
                throw new NotFound('Property not found');
            }

            return this.mapToPropertyResponse(property);
        } catch (error) {
            if (error instanceof HttpError) {
                throw error;
            }
            throw new InternalServerError('Failed to update property');
        }
    }

    async deleteProperty(propertyId: string): Promise<IPropertyResponse> {
        const property = await Property.findByIdAndDelete(propertyId);

        if (!property) {
            throw new NotFound('Property not found');
        }

        return this.mapToPropertyResponse(property);
    }

    async getPropertiesWithFilter(filters: Map<string, string>): Promise<IPropertyResponse[]> {
        return this.getAvailablePropertiesWithoutBookingsFilteredBy(filters);
    }

    async getPropertiesByUserId(userId: string): Promise<IPropertyResponse[]> {
        const properties = await Property.find({owner: userId});
        return properties.map(property => this.mapToPropertyResponse(property));
    }


    async removePropertyImage(propertyId: string, imageId: string) {

        const propertyResult = await Property.findByIdAndUpdate(propertyId, {
            $pull: {imagePaths: imageId}
        });

        if (!propertyResult) {
            throw new NotFound('Property not found');
        }

        return this.mapToPropertyResponse(propertyResult);
    }
}
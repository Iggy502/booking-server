import {Property} from '../models/property.model';
import {
    IPropertyBase,
    IPropertyCreate,
    IPropertyDocument,
    IPropertyResponse,
    IPropertyUpdate
} from '../models/interfaces';
import {container, injectable} from 'tsyringe';
import {GeocodingService} from "./geocoding.service";
import {Booking} from "../models/booking.model";
import {InternalServerError, NotFound} from "http-errors";
import {ImageConversionUtil} from "./util/image/image-conversion-util";
import {User} from "../models/user.model";


@injectable()
export class PropertyService {

    private geocodingService: GeocodingService;

    constructor() {
        this.geocodingService = container.resolve(GeocodingService);
    }

    async createProperty(propertyData: IPropertyCreate): Promise<IPropertyResponse> {
        try {
            const ownerUserId = await User.exists({_id: propertyData.owner});

            if (!ownerUserId) {
                throw NotFound('Owner not found');
            }

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
            console.error('Error creating property:', error);
            throw InternalServerError('Failed to create property');
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
        const propertyResponse = <IPropertyResponse>property.toObject();

        const imagesPathsFullUrl = propertyResponse.imagePaths?.map(imagePath => {
            return ImageConversionUtil.convertPathToUrl(imagePath, process.env.AWS_S3_BUCKET || '');
        });

        if (imagesPathsFullUrl) {
            return {...propertyResponse, imagePaths: imagesPathsFullUrl};
        }

        return propertyResponse;
    }

    async getAllProperties(): Promise<IPropertyResponse[]> {
        const properties = await Property.find({available: true});
        console.log('properties: ', properties);
        return properties.map(property => this.mapToPropertyResponse(property));
    }

    async getAllAvailableProperties(): Promise<IPropertyResponse[]> {
        const properties = await Property.find({available: true});
        return properties.map(property => this.mapToPropertyResponse(property));
    }

    async verifyNoOverlappingBookings(propertyId: string, checkIn: Date, checkOut: Date): Promise<boolean> {

        if (!Property.exists({_id: propertyId, available: true})) {
            throw NotFound('Property not found or not available');
        }

        let newVar = await Booking.exists({
            property: propertyId,
            status: {$in: ['confirmed', 'pending']},
            $nor: [
                {checkOut: {$lt: checkIn}},
                {checkIn: {$gt: checkOut}}
            ]
        });

        console.log('overlapping is there: ', newVar);
        return !newVar;
    }

    async getPropertyById(propertyId: string): Promise<IPropertyResponse> {
        const property = await Property.findOne({_id: propertyId, available: true});

        if (!property) {
            throw new NotFound('Property not found or not available');
        }

        return this.mapToPropertyResponse(property);
    }

    async getPropertyByIds(propertyIds: string[]): Promise<IPropertyResponse[]> {
        const properties = await Property.find({_id: {$in: propertyIds}, available: true});
        return properties.map(property => this.mapToPropertyResponse(property));
    }

    async updatePropertyImages(propertyId: string, imagePaths: NonNullable<IPropertyBase['imagePaths']>): Promise<IPropertyResponse> {
        const property = await Property.findById(propertyId);

        if (!property) {
            throw new NotFound('Property not found');
        }

        const propertyImages = property.imagePaths || [];
        propertyImages.push(...imagePaths);

        const updatedProperty = await Property
            .findByIdAndUpdate(propertyId, {imagePaths: propertyImages}, {new: true});

        if (!updatedProperty) {
            throw new InternalServerError('Failed to update property images');
        }

        return this.mapToPropertyResponse(property);
    }


    async updateProperty(propertyId: string, propertyData: IPropertyUpdate): Promise<IPropertyResponse> {
        try {
            let updateData: IPropertyUpdate = {...propertyData};

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
            console.error('Error updating property:', error);
            throw new InternalServerError('Failed to update property');
        }
    }

    async deleteProperty(propertyId: string): Promise<void> {
        const property = await Property.findByIdAndDelete(propertyId);

        if (!property) {
            throw new NotFound('Property not found');
        }
    }

    async getPropertiesByUserId(userId: string): Promise<IPropertyResponse[]> {
        const properties = await Property.find({owner: userId});
        return properties.map(property => this.mapToPropertyResponse(property));
    }


    async removePropertyImage(propertyId: string, imageURL: string) {
        let imagePath = ImageConversionUtil.convertUrlToPath(imageURL, process.env.AWS_S3_BUCKET || '');

        const propertyResult = await Property.findByIdAndUpdate(propertyId, {
            $pull: {imagePaths: imagePath}
        });

        if (!propertyResult) {
            throw new NotFound('Property not found');
        }

        return this.mapToPropertyResponse(propertyResult);
    }
}
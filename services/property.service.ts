//Property service to handle property operations
// Objective: Property service to handle property operations
import {Property} from '../models/property.model';
import {IPropertyCreate, IPropertyDocument, IPropertyResponse, IPropertyUpdate} from '../models/interfaces';
import {injectable} from 'tsyringe';
import {HttpError} from "./exceptions/http-error";

@injectable()
export class PropertyService {

    async createProperty(propertyData: IPropertyCreate): Promise<IPropertyResponse> {
        const property = await Property.create(propertyData);
        return this.mapToPropertyResponse(property);
    }

    async createPropertyWithOwner(userId: string, propertyData: IPropertyCreate): Promise<IPropertyResponse> {
        const property = await Property.create({
            ...propertyData,
            owner: userId
        });

        return this.mapToPropertyResponse(property);
    }


    //make property available
    async makePropertyAvailable(propertyId: string): Promise<IPropertyResponse> {
        const property = await Property.findByIdAndUpdate(propertyId, {available: true}, {new: true});

        if (!property) {
            throw new HttpError(404, 'Property not found');
        }

        return this.mapToPropertyResponse(property);
    }

    private mapToPropertyResponse(property: IPropertyDocument): IPropertyResponse {
        return <IPropertyResponse>property.toObject();
    }

    async getAllProperties(): Promise<IPropertyResponse[]> {
        const properties = await Property.find();
        return properties.map(property => this.mapToPropertyResponse(property));
    }

    async getAllAvailableProperties(): Promise<IPropertyResponse[]> {
        const properties = await Property.find({available: true});
        return properties.map(property => this.mapToPropertyResponse(property));
    }

    async getAvailablePropertiesWithoutBookingsFilteredBy(filter: Map<string, string>): Promise<IPropertyResponse[]> {
        const matchConditions: { [key: string]: any } = {
            available: true
        };

        filter?.forEach((value, key) => {
            if (key === 'address') {
                try {
                    const addressObj = JSON.parse(decodeURI(value));
                    // Match all address fields individually for more flexible matching
                    Object.entries(addressObj).forEach(([addressKey, addressValue]) => {
                        matchConditions[`address.${addressKey}`] = addressValue;
                    });
                } catch (error) {
                    console.error('Error parsing address:', error);
                    throw new HttpError(400, 'Invalid address format');
                }
            } else if (key === 'maxGuests') {
                // Convert string to number for numeric comparisons
                matchConditions[key] = parseInt(value, 10);
            } else if (key === 'pricePerNight') {
                // Convert string to number for numeric comparisons
                matchConditions[key] = parseFloat(value);
            } else {
                matchConditions[key] = value;
            }
        });

        console.log('Query conditions:', JSON.stringify(matchConditions, null, 2));
        const properties = await Property.find(matchConditions);
        console.log('Found properties:', properties.length);

        return properties.map(property => this.mapToPropertyResponse(property));
    }


    async getPropertyById(propertyId: string): Promise<IPropertyResponse> {
        const property = await Property.findById(propertyId);

        if (!property) {
            throw new HttpError(404, 'Property not found');
        }

        return this.mapToPropertyResponse(property);
    }

    async updateProperty(propertyId: string, propertyData: IPropertyUpdate): Promise<IPropertyResponse> {
        const property = await Property.findByIdAndUpdate(propertyId, propertyData, {new: true});

        if (!property) {
            throw new HttpError(404, 'Property not found');
        }

        return this.mapToPropertyResponse(property);
    }

    async deleteProperty(propertyId: string): Promise<IPropertyResponse> {
        const property = await Property.findByIdAndDelete(propertyId);

        if (!property) {
            throw new HttpError(404, 'Property not found');
        }

        return this.mapToPropertyResponse(property);
    }

    async getPropertiesWithFilter(filters: Map<string, string>): Promise<IPropertyResponse[]> {
        return this.getAvailablePropertiesWithoutBookingsFilteredBy(filters);
    }

    async getPropertiesByUserId(userId: string) {
        const properties = await Property.find({owner: userId});
        return properties.map(property => this.mapToPropertyResponse(property));
    }
}
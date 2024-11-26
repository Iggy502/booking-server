//Property service to handle property operations
// Objective: Property service to handle property operations
import {Property} from '../models/property.model';
import {IPropertyCreate, IPropertyResponse} from '../models/interfaces';
import {injectable} from 'tsyringe';
import {HttpError} from "../exceptions/http-error";

@injectable()
export class PropertyService {

    async createProperty(propertyData: IPropertyCreate): Promise<IPropertyResponse> {
        const property = await Property.create(propertyData);
        return <IPropertyResponse>property.toObject();
    }

    async createPropertyWithOwner(userId: string, propertyData: IPropertyCreate): Promise<IPropertyResponse> {
        const property = await Property.create({
            ...propertyData,
            owner: userId
        });

        return <IPropertyResponse>property.toObject();
    }

    async getAllPropertiesFilteredBy(filter: Map<string, string>): Promise<IPropertyResponse[]> {
        //verify if filter key matches the schema

        if (!filter) {
            throw new HttpError(400, 'Invalid filter');
        }

        if (filter.size > 0) {
            const schemaKeys = Object.keys(Property.schema.obj);
            const filterKeys = filter?.keys();
            const invalidKeys = [...filterKeys].filter(key => !schemaKeys.includes(key));

            if (invalidKeys.length) {
                throw new HttpError(400, `Invalid filter keys: ${invalidKeys.join(', ')}`);
            }

            let filtersForFind: any = {};

            if (filter.has('address') && filter.get('address')) {
                filtersForFind.address = JSON.parse(decodeURI(filter.get('address') as string))
            }

            filter.forEach((value, key) => {
                if (key !== 'address' && value) {
                    filtersForFind[key] = value;
                }
            });

            const properties = await Property.find(filtersForFind);

            return properties.map(property => <IPropertyResponse>property.toObject());
        }

        return this.getAllProperties();


    }

    async getAllProperties(): Promise<IPropertyResponse[]> {
        const properties = await Property.find();
        return properties.map(property => <IPropertyResponse>property.toObject());
    }

    async getPropertiesWithoutBookingsFilteredBy(filter: Map<string, string>): Promise<IPropertyResponse[]> {
        const matchConditions: { [key: string]: any } = {
            'bookings.0': {$exists: false}
        };

        filter?.forEach((value, key) => {
            if (key === 'address') {
                matchConditions['address'] = JSON.parse(decodeURI(value));
            } else {
                matchConditions[key] = value;
            }
        });

        const properties = await Property.aggregate([
            {
                $lookup: {
                    from: 'bookings',
                    localField: '_id',
                    foreignField: 'property',
                    as: 'bookings'
                }
            },
            {
                $match: matchConditions
            },
            {
                $project: {
                    bookings: 0
                }
            }
        ]);

        console.log(properties);


        return properties.map(property =>
            Property.hydrate(property).toObject() as IPropertyResponse
        );
    }


    async getPropertyById(propertyId: string): Promise<IPropertyResponse> {
        const property = await Property.findById(propertyId);
        return <IPropertyResponse>property?.toObject();
    }

    async updateProperty(propertyId: string, propertyData: Partial<IPropertyCreate>): Promise<IPropertyResponse> {
        const property = await Property.findByIdAndUpdate(propertyId, propertyData, {new: true});
        return <IPropertyResponse>property?.toObject();
    }

    async deleteProperty(propertyId: string): Promise<IPropertyResponse> {
        const property = await Property.findByIdAndDelete(propertyId);
        return <IPropertyResponse>property?.toObject();
    }

    async getPropertiesWithFilter(availableOnly: boolean, filters: Map<string, string>): Promise<IPropertyResponse[]> {
        //if availableOnly is false, return all properties
        if (!availableOnly) {
            return this.getAllPropertiesFilteredBy(filters);
        }
        //if availableOnly is true
        return this.getPropertiesWithoutBookingsFilteredBy(filters);


    }
}
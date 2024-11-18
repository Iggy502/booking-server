// src/models/property.model.ts
import mongoose from 'mongoose';
import {IPropertyDocument, IPropertyCreate, IPropertyResponse, IPropertyModel} from './interfaces';


const propertySchema = new mongoose.Schema<IPropertyDocument>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        address: {
            street: {type: String, required: true},
            city: {type: String, required: true},
            country: {type: String, required: true},
            postalCode: {type: String, required: true},
        },
        pricePerNight: {
            type: Number,
            required: true,
            min: 0,
        },
        maxGuests: {
            type: Number,
            required: true,
            min: 1,
        },
    },
    {
        timestamps: true,
        toObject: {
            transform: (doc, ret) => {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
                return ret;
            }
        }
    }
);


propertySchema.statics.createProperty = async function (
    userId: string,
    propertyData: IPropertyCreate
): Promise<IPropertyResponse> {
    const property = await this.create({
        ...propertyData,
        owner: userId
    });
    // Convert the Mongoose document to a plain JavaScript object and cast it to IPropertyResponse
    // This is necessary because Mongoose documents have additional methods and properties that are not part of the IPropertyResponse interface.
    // By converting to a plain object, we strip away these extra properties, ensuring the returned object conforms to the IPropertyResponse type.
    return <IPropertyResponse>property.toObject();
};

export const Property = mongoose.model<IPropertyDocument, IPropertyModel>('Property', propertySchema);




// src/models/property.model.ts
import mongoose from 'mongoose';
import {IPropertyDocument, IPropertyModel} from './interfaces';


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
            required: false,
        },
        description: {
            type: String,
            required: true,
        },
        available: {
            type: Boolean,
            required: false,
            default: false,
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

export const Property = mongoose.model<IPropertyDocument, IPropertyModel>('Property', propertySchema);




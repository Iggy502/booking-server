// src/models/property.model.ts
import mongoose from 'mongoose';
import {IPropertyDocument, IPropertyModel} from './interfaces';
import {AmenityType, IAmenity} from "./interfaces/amenity.type";


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
            longitude: {type: Number, required: false},
            latitude: {type: Number, required: false},
        },
        pricePerNight: {
            type: Number,
            required: true,
            min: 0,
        },
        avgRating: {
            type: Number,
            required: true,
            default: 0,
            set: (v: number) => Math.round(v * 10) / 10 // Round to 1 decimal place
        },
        totalRatings: {
            type: Number,
            required: true,
            default: 0,
        },
        maxGuests: {
            type: Number,
            required: true,
            min: 1,
        },
        imagePaths: {
            type: [String],
            required: false,
            default: [],
        },
        amenities: {
            type: [{
                _id: false, // This prevents MongoDB from creating _id for each amenity
                type: {
                    type: String,
                    enum: AmenityType,
                    required: true,
                },
                description: {type: String, required: false},
                amount: {type: Number, required: false},
            }],
            required: false,
            validate: {
                validator: (amenities: IAmenity[]) => {
                    // If no amenities, it's valid
                    if (!amenities || amenities.length === 0) return true;

                    // Get all types
                    const types = amenities.map(a => a.type);

                    // Check if the number of unique types equals the total number of types
                    return new Set(types).size === types.length;
                },
                message: 'Duplicate amenity types are not allowed'
            }
        },
    },
    {
        timestamps: true,
        toObject: {
            transform: (doc, ret) => {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
                return ret;
            }
        }
    }
);


// Pre-save middleware to ensure validators run on updates
propertySchema.pre('findOneAndUpdate', function (next) {
    this.setOptions({runValidators: true});
    next();
});

export const Property = mongoose.model<IPropertyDocument, IPropertyModel>('Property', propertySchema);




// src/models/rating.model.ts
import mongoose from 'mongoose';
import {IRatingDocument} from './interfaces/rating.types';

const ratingSchema = new mongoose.Schema<IRatingDocument>(
    {
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Property',
            required: true,
            index: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
            set: (v: number) => Math.round(v * 10) / 10
        },
        review: {
            type: String,
            required: true,
            trim: true,
            minlength: 10,
            maxlength: 1000
        },
        helpful: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }]
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

// Ensure one review per user per property
ratingSchema.index({property: 1, user: 1}, {unique: true});

export const Rating = mongoose.model<IRatingDocument>('Rating', ratingSchema);
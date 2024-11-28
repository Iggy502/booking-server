// src/models/booking.model.ts
import mongoose from 'mongoose';
import {IBookingDocument, IBookingModel} from './interfaces';

const bookingSchema = new mongoose.Schema<IBookingDocument>(
    {
        property: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Property',
            required: true,
        },
        guest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        checkIn: {
            type: Date,
            required: true,
        },
        checkOut: {
            type: Date,
            required: true,
        },
        totalPrice: {
            type: Number,
            required: false,
            min: 0,
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled'],
            default: 'pending',
        },
        numberOfGuests: {
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


export const Booking = mongoose.model<IBookingDocument, IBookingModel>('Booking', bookingSchema);


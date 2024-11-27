// src/models/booking.model.ts
import mongoose, {Model} from 'mongoose';
import {IBookingDocument, IBookingCreate, IBookingResponse, IBookingModel} from './interfaces';
import {Property} from './property.model';


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
            transform: (doc: IBookingDocument, ret) => {
                ret.id = ret._id;
                delete ret._id;
                delete ret.__v;
                return ret as IBookingResponse;
            }
        }
    }
);




export const Booking = mongoose.model<IBookingDocument, IBookingModel>('Booking', bookingSchema);


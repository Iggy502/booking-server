// src/models/booking.model.ts
import mongoose from 'mongoose';
import {IBookingDocument, IBookingModel, IUserModel} from './interfaces';
import {IConversationDocument, IMessageDocument} from "./interfaces/chat.types";


const MessageSchema = new mongoose.Schema<IMessageDocument>({
        content: {
            type: String,
            required: true,
        },
        from: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        to: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        read: {
            type: Boolean,
            default: false,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        }
    },
    {
        timestamps: false, //Will be custom timestamps
        toObject: {
            transform: (doc, ret) => {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
                return ret;
            }
        }
    });


const ConversationSchema = new mongoose.Schema<IConversationDocument>({
        active: {
            type: Boolean,
            default: true,
        },
        messages: {
            type: [MessageSchema],
            required: true,
            default: []
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
            validate: {
                validator: function (value: Date) {
                    return value > this.checkIn;
                },
                message: 'Check-out date must be after check-in date'
            }
        },
        totalPrice: {
            type: Number,
            required: true,
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
        conversation: {
            type: ConversationSchema,
            required: true,
        }
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


export const Booking = mongoose.model<IBookingDocument, IBookingModel>('Booking', bookingSchema);


// src/models/booking.model.ts
import mongoose, {Model} from 'mongoose';
import {IBookingDocument, IBookingCreate, IBookingResponse} from './interfaces';
import {Property} from './property.model';

interface IBookingModel extends Model<IBookingDocument> {
    createBooking(userId: string, bookingData: IBookingCreate): Promise<IBookingResponse>;
}

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

// Validate checkout date is after checkin
bookingSchema.pre('save', function (next) {
    if (this.checkOut <= this.checkIn) {
        next(new Error('Check-out date must be after check-in date'));
    }
    next();
});

// Validate number of guests against property capacity
bookingSchema.pre('save', async function (next) {
    const property = await Property.findById(this.property);
    if (!property) {
        next(new Error('Property not found'));
        return;
    }
    if (this.numberOfGuests > property.maxGuests) {
        next(new Error(`Maximum ${property.maxGuests} guests allowed`));
        return;
    }
    next();
});


// Instance methods
bookingSchema.methods.calculateDuration = function (): number {
    return this.calculateDuration(this.checkIn, this.checkOut);
};
bookingSchema.methods.isPast = function (): boolean {
    return this.checkOut < new Date();
};


const calculateDuration = (checkIn: Date, checkOut: Date): number => {
    return (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24);
}


// Static method to create booking
bookingSchema.statics.createBooking = async function (
    userId: string,
    bookingData: IBookingCreate
): Promise<IBookingResponse> {
    const property = await Property.findById(bookingData.property);
    if (!property) {
        throw new Error('Property not found');
    }
    const duration = (new Date(bookingData.checkOut).getTime() - new Date(bookingData.checkIn).getTime()) / (1000 * 60 * 60 * 24);

    const booking = await this.create({
        ...bookingData,
        guest: userId,
        totalPrice: property.pricePerNight * duration,
        status: 'pending'
    });

    return <IBookingResponse>booking.toObject();
};

export const Booking = mongoose.model<IBookingDocument, IBookingModel>('Booking', bookingSchema);


// src/models/types/booking.index.ts
import { Document, Types } from 'mongoose';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface IBookingBase {
    property: Types.ObjectId;
    guest: Types.ObjectId;
    checkIn: Date;
    checkOut: Date;
    totalPrice: number;
    status: BookingStatus;
    numberOfGuests: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IBookingDocument extends IBookingBase, Document {
    calculateDuration(): number;
    isPast(): boolean;
}

export interface IBookingCreate extends Omit<IBookingBase, 'createdAt' | 'updatedAt' | 'totalPrice' | 'status'> {}

export interface IBookingResponse extends IBookingBase {
    id: string;
}
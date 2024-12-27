// src/models/types/booking.index.ts
import {Document, Types} from 'mongoose';
import {Conversation} from "./chat.types";

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface IBookingBase {
    property: Types.ObjectId;
    guest: Types.ObjectId;
    checkIn: Date;
    checkOut: Date;
    totalPrice: number;
    status: BookingStatus;
    numberOfGuests: number;
    conversation: Conversation;
}

export interface IBookingDocument extends IBookingBase, Document {
    calculateDuration(endDate: Date, startDate: Date): number;
    toObject(): IBookingResponse;
    calculateTotalPrice(): number;
}

export interface IBookingCreate extends Omit<IBookingBase, 'totalPrice' | 'status'> {
}

export interface IBookingUpdate extends Partial<Omit<IBookingBase, 'property' | 'guest'>> {
}


export interface IBookingResponse extends IBookingBase {
    id: string;
}
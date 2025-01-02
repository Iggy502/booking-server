// src/models/types/booking.index.ts
import {Document, Types} from 'mongoose';
import {Conversation, ConversationResponse, IConversationDocument} from "./chat.types";
import {IPropertyDocument, IPropertyResponse} from "./property.types";
import {IUserDocument, IUserResponse} from "./user.types";

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
    toObject(): IBookingResponse | PopulatedBookingResponse;
    calculateTotalPrice(): number;
}

export interface IBookingCreate extends Omit<IBookingBase, 'totalPrice' | 'status'> {
}

export interface IBookingUpdate extends Partial<Omit<IBookingBase, 'property' | 'guest'>> {
    readonly property?: Types.ObjectId;
    readonly guest?: Types.ObjectId;
}


export interface IBookingResponse extends IBookingBase {
    id: string;
}


// Note: PopulatedBookingDocument should match BookingWithPopulated
export interface PopulatedBookingDocument extends Omit<IBookingDocument, 'property' | 'guest' | 'conversation'> {
    property: Pick<PopulatedPropertyDocument, 'name' | 'owner'>;
    guest: Pick<IUserDocument, 'firstName' | 'lastName' | 'profilePicturePath'>;
    conversation: IConversationDocument;
}

export interface PopulatedPropertyDocument extends Omit<IPropertyDocument, 'owner'> {
    owner: Pick<IUserDocument, 'firstName' | 'lastName' | 'profilePicturePath'>;
}

export interface PopulatedPropertyResponse extends Omit<IPropertyResponse, 'owner'> {
    owner: IUserResponse;
}


export interface PopulatedBookingResponse extends Omit<IBookingResponse, 'property' | 'guest' | 'conversation'> {
    property: Pick<PopulatedPropertyResponse, 'name' | 'owner'>;
    guest: Pick<IUserResponse, 'firstName' | 'lastName' | 'profilePicturePath'>;
    conversation: ConversationResponse;
}
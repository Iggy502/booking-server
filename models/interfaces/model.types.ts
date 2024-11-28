// src/models/types/model.index.ts
import {Model} from 'mongoose';
import {IUserCreate, IUserDocument, IUserResponse} from './user.types';
import {IPropertyCreate, IPropertyDocument, IPropertyResponse} from './property.types';
import {IBookingCreate, IBookingDocument, IBookingResponse} from './booking.types';

export interface IUserModel extends Model<IUserDocument> {
    createUser(userData: IUserCreate): Promise<IUserResponse>;
}

export interface IPropertyModel extends Model<IPropertyDocument> {
    createProperty(userId: string, propertyData: IPropertyCreate): Promise<IPropertyResponse>;
}

export interface IBookingModel extends Model<IBookingDocument> {
    createBooking(userId: string, bookingData: IBookingCreate): Promise<IBookingResponse>;
}
// src/models/types/model.index.ts
import {Model} from 'mongoose';
import {IUserCreate, IUserDocument, IUserResponse} from './user.types';
import {IPropertyCreate, IPropertyDocument, IPropertyResponse} from './property.types';
import {IBookingCreate, IBookingDocument, IBookingResponse} from './booking.types';

export interface IUserModel extends Model<IUserDocument> {
}

export interface IPropertyModel extends Model<IPropertyDocument> {
}

export interface IBookingModel extends Model<IBookingDocument> {
}
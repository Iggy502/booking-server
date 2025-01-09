// src/models/types/model.index.ts
import {Model} from 'mongoose';
import {IUserDocument} from './user.types';
import {IPropertyDocument} from './property.types';
import {IBookingDocument} from './booking.types';

export interface IUserModel extends Model<IUserDocument> {
}

export interface IPropertyModel extends Model<IPropertyDocument> {
}

export interface IBookingModel extends Model<IBookingDocument> {
}
// src/models/types/property.index.ts
import {Document, Types} from 'mongoose';

interface IAddress {
    street: string;
    city: string;
    country: string;
    postalCode: string;
}

export interface IPropertyBase {
    name: string;
    owner: Types.ObjectId;
    description: string;
    address: IAddress;
    pricePerNight: number;
    maxGuests: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IPropertyDocument extends IPropertyBase, Document {
}

export interface IPropertyCreate extends Omit<IPropertyBase, 'createdAt' | 'updatedAt' | 'owner'> {
}

export interface IPropertyResponse extends IPropertyBase {
    id: string;
}
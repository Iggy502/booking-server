// src/models/types/property.index.ts
import {Document, Types} from 'mongoose';

export interface IAddress {
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
    available: boolean;
}

export interface IPropertyDocument extends IPropertyBase, Document {
}

//property should be made available after creation
export interface IPropertyCreate extends Omit<IPropertyBase, 'available'> {
}

export interface IPropertyUpdate extends Partial<IPropertyBase> {

}

export interface IPropertyResponse extends IPropertyBase {
    id: string;
}
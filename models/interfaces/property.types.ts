// src/models/types/property.index.ts
import {Document, Types} from 'mongoose';
import {IAmenity} from "./amenity.type";

export interface IAddress {
    street: string;
    city: string;
    country: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
}

export interface IPropertyBase {
    name: string;
    owner: Types.ObjectId;
    description: string;
    address: IAddress;
    pricePerNight: number;
    maxGuests: number;
    available: boolean;
    imagePaths?: string[];
    amenities?: IAmenity[];
}

export interface IPropertyDocument extends IPropertyBase, Document {
}

export interface IPropertyCreate extends Omit<IPropertyBase, 'imagePaths'> {
}

export interface IPropertyUpdate extends Partial<IPropertyBase> {
    imagePaths?: never; //imagePaths should be updated separately
}

export interface IPropertyResponse extends IPropertyBase {
    id: string;
}
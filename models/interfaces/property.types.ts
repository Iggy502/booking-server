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

//property should be made available after creation
export interface IPropertyCreate extends Omit<IPropertyBase, 'available'> {

}

export interface IPropertyUpdate extends Partial<IPropertyBase> {

}

export interface IPropertyResponse extends IPropertyBase {
    id: string;
}
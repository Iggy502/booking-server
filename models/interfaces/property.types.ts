// src/models/types/property.index.ts
import {Document, Types} from 'mongoose';
import {IAmenity} from "./amenity.type";
import {IUserDocument, IUserResponse} from "./user.types";

export interface IAddress {
    street: string;
    city: string;
    country: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
}

export interface IRating {
    user: Types.ObjectId;
    rating: number;
    review: string;
    helpful: Types.ObjectId[]; // Users who found this helpful
    createdAt: Date;
    updatedAt: Date;
}


export interface IPropertyBase {
    name: string;
    owner: Types.ObjectId;
    description: string;
    address: IAddress;
    pricePerNight: number;
    maxGuests: number;
    avgRating: number;
    totalRatings: number;
    available: boolean;
    imagePaths?: string[];
    amenities?: IAmenity[];
}

export interface IPropertyDocument extends IPropertyBase, Document {
}

export interface PopulatedPropertyDocument extends Omit<IPropertyDocument, 'owner'> {
    owner: Pick<IUserDocument, 'firstName' | 'lastName' | 'profilePicturePath'>;
}


export interface IPropertyCreate extends Omit<IPropertyBase, 'imagePaths'> {
}

export interface IPropertyUpdate extends Partial<IPropertyCreate> {
}

export interface PopulatedPropertyResponse extends Omit<IPropertyResponse, 'owner'> {
    owner: IUserResponse;
}


export interface IPropertyResponse extends IPropertyBase {
    id: string;
}
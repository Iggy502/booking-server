// src/models/types/rating.types.ts
import {Document, Types} from 'mongoose';
import {IPropertyDocument, IPropertyResponse} from "./property.types";
import {IUserDocument, IUserResponse} from "./user.types";

export interface IRatingBase {
    property: Types.ObjectId;
    user: Types.ObjectId;
    rating: number;
    review: string;
    helpful: Types.ObjectId[]; // Users who found this helpful

}

export interface IRatingDocument extends IRatingBase, Document {
    createdAt: Date;
    updatedAt: Date;

}


export interface IRatingCreate extends Omit<IRatingBase, 'helpful' | 'user' | 'property'> {
    property: string;
    user: string;
}

export interface IRatingResponse extends Omit<IRatingBase, 'property' | 'user' | 'helpful'> {
    id: string;
    property: string;
    user: string;
    createdAt: Date;
    updatedAt: Date;
    helpful: number;
}

export interface IRatingDocumentPopulated extends Omit<IRatingDocument, 'property' | 'user'> {
    property: Pick<IPropertyDocument, 'id' | 'name' | 'avgRating' | 'totalRatings'>;
    user: Pick<IUserDocument, 'firstName' | 'lastName' | 'profilePicturePath'>;
}

export interface IRatingResponsePopulated extends Omit<IRatingResponse, 'property' | 'user'> {
    property: Pick<IPropertyResponse, 'id' | 'name' | 'avgRating' | 'totalRatings'>
    user: Pick<IUserResponse, 'id' | 'firstName' | 'lastName' | 'profilePicturePath'>

}











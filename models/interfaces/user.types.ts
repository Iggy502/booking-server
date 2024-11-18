import {Document} from 'mongoose';

export interface IUserBase {
    email: string;
    name: string;
    phone: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserDocument extends IUserBase, Document {
    comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserCreate extends Omit<IUserBase, 'createdAt' | 'updatedAt'> {
}

export interface IUserResponse extends Omit<IUserBase, 'password'> {
    id: string;
}
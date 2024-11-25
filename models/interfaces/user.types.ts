import {Document} from 'mongoose';

export interface IUserBase {
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    password: string;
}

export interface IUserDocument extends IUserBase, Document {
    comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserCreate extends IUserBase{
}

export interface IUserResponse extends Omit<IUserBase, 'password'> {
    id: string;
}
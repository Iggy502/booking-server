import {UserRole} from "../../../models/interfaces";
import {Request} from 'express';


export interface TokenPayload {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: UserRole[];
    profilePicturePath?: string;
}

export interface RefreshTokenPayload {
    id: string;
    deviceInfo: string;
    lastUsed: Date;
}

export interface AuthRequest extends Request {
    user?: TokenPayload;
}
import {UserRole} from "../../../models/interfaces";
import {Request} from 'express';


export interface TokenPayload {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: UserRole[];
}

export interface RefreshTokenPayload {
    id: string;
    deviceInfo: string;
}

export interface AuthRequest extends Request {
    user?: TokenPayload;
}
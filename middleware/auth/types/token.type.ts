import {UserRole} from "../../../models/interfaces";
import {Request} from 'express';


export interface TokenPayload {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: UserRole[];
}

export interface AuthRequest extends Request {
    user?: TokenPayload;
}
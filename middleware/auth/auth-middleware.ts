// src/middleware/auth.middleware.ts
import {NextFunction, Response} from 'express';
import {AuthRequest, TokenPayload} from './types/token.type';
import {UnauthorizedError} from './exceptions/unauthorized.error';
import {AuthUtils} from './utils/auth.utils';
import {singleton} from 'tsyringe';
import {Unauthorized} from "http-errors";
import {UserRole} from "../../models/interfaces";

@singleton()
export class AuthMiddleware {
    private authUtils: AuthUtils;

    constructor() {
        this.authUtils = new AuthUtils();
    }

    authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const authHeader = req.header('Authorization');
            const token = authHeader?.replace('Bearer ', '');

            if (!token) {
                throw Unauthorized('No token provided');
            }

            try {
                req.user = this.authUtils.verifyToken(token) as TokenPayload;
                next();
            } catch (tokenError) {
                throw Unauthorized('Token expired or invalid');
            }
        } catch (error: any) {
            console.error('Authentication error:', error);
            next(error);
        }
    };

    requireRoles = (roles: string[], adminOverride = false) => {
        return async (req: AuthRequest, res: Response, next: NextFunction) => {
            try {
                if (!req.user?.roles) {
                    throw new UnauthorizedError('No roles found');
                }

                const hasRequiredRole = req.user.roles.some(userRole =>
                    roles.includes(userRole)
                ) || (adminOverride && req.user.roles.includes(UserRole.ADMIN));

                if (!hasRequiredRole) {
                    throw new UnauthorizedError('Insufficient permissions');
                }

                next();
            } catch (error: any) {
                res.status(403).json({message: error.message});
            }
        };
    };

}

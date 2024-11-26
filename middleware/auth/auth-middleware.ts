// src/middleware/auth.middleware.ts
import {Response, NextFunction} from 'express';
import {AuthRequest} from './types/token.type';
import {UnauthorizedError} from './exceptions/unauthorized.error';
import {AuthUtils} from './utils/auth.utils';
import {singleton} from 'tsyringe';

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
            console.log('Authorization Header:', authHeader);
            console.log('Token:', token);

            if (!token) {
                throw new UnauthorizedError('No token provided');
            }

            const decoded = this.authUtils.verifyToken(token);

            // Attach user to request
            req.user = decoded;

            next();
        } catch (error) {
            res.status(401).json({message: 'Please authenticate'});
        }
    };

    requireRoles = (roles: string[]) => {
        return async (req: AuthRequest, res: Response, next: NextFunction) => {
            try {
                if (!req.user?.roles) {
                    throw new UnauthorizedError('No roles found');
                }

                const hasRequiredRole = req.user.roles.some(userRole =>
                    roles.includes(userRole)
                );

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

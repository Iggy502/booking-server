// src/middleware/auth.middleware.ts
import {NextFunction, Response} from 'express';
import {AuthRequest, TokenPayload} from './types/token.type';
import {AuthUtils} from './utils/auth.utils';
import {singleton} from 'tsyringe';
import {Unauthorized} from "http-errors";
import {UserRole} from "../../models/interfaces";
import {User} from "../../models/user.model";

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
                const jwtPayload = this.authUtils.verifyToken(token) as TokenPayload;

                const userForToken = await User.findById(jwtPayload.id);

                if (!userForToken) {
                    res.status(401).json({
                        code: 'AUTH_USER_NOT_FOUND',
                        message: 'User not found'
                    });
                    return;
                }

                req.user = jwtPayload;

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
                    throw Unauthorized('No roles found');
                }

                const hasRequiredRole = req.user.roles.some(userRole =>
                    roles.includes(userRole)
                ) || (adminOverride && req.user.roles.includes(UserRole.ADMIN));

                if (!hasRequiredRole) {
                    throw Unauthorized('Insufficient permissions');
                }

                next();
            } catch (error: any) {
                res.status(403).json({message: error.message});
            }
        };
    };

}

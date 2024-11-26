import jwt from 'jsonwebtoken';
import { IUserDocument } from '../../../models/interfaces';
import { TokenPayload} from '../types/token.type';
import {UserRole} from "../../../models/interfaces";
import {UnauthorizedError} from "../exceptions/unauthorized.error";

export class AuthUtils {
    constructor(
        private readonly jwtSecret: string = process.env.JWT_SECRET || 'your-secret-key',
        private readonly jwtExpiresIn: string = '15m',
        private readonly refreshSecret: string = process.env.REFRESH_SECRET || 'your-refresh-secret',
        private readonly refreshExpiresIn: string = '7d'
    ) {}

    generateTokens(user: IUserDocument, deviceInfo: string): { accessToken: string; refreshToken: string } {
        const payload: TokenPayload = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roles: user.roles
        };

        const accessToken = jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.jwtExpiresIn
        });

        const refreshToken = jwt.sign({
            id: user.id,
            deviceInfo
        }, this.refreshSecret, {
            expiresIn: this.refreshExpiresIn
        });

        return { accessToken, refreshToken };
    }

    verifyToken(token: string, isRefreshToken: boolean = false): any {
        try {
            return jwt.verify(token, isRefreshToken ? this.refreshSecret : this.jwtSecret);
        } catch (error) {
            throw new UnauthorizedError('Invalid token');
        }
    }
}
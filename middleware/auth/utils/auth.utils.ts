import jwt, {JwtPayload} from 'jsonwebtoken';
import {IUserDocument} from '../../../models/interfaces';
import {RefreshTokenPayload, TokenPayload} from '../types/token.type';
import {UnauthorizedError} from "../exceptions/unauthorized.error";

export class AuthUtils {
    constructor(
        private readonly jwtSecret: string = process.env.JWT_SECRET || 'your-secret-key',
        private readonly jwtExpiresIn: string = '15m',
        private readonly refreshSecret: string = process.env.REFRESH_SECRET || 'your-refresh-secret',
        private readonly refreshExpiresIn: string = '7d'
    ) {
    }

    generateAccessToken(user: IUserDocument): string {
        const payload: TokenPayload = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            roles: user.roles
        };

        return jwt.sign(payload, this.jwtSecret, {
            expiresIn: this.jwtExpiresIn,
            algorithm: 'HS256'
        });
    }

    generateRefreshToken(user: IUserDocument, deviceInfo: string): string {
        const payload: RefreshTokenPayload = {
            id: user.id,
            deviceInfo,
            lastUsed: new Date()
        }

        return jwt.sign({
            payload
        }, this.refreshSecret, {
            expiresIn: this.refreshExpiresIn,
            algorithm: 'HS256'
        });
    }


    verifyToken(token: string, isRefreshToken: boolean = false) {
        try {
            let verify = jwt.verify(token, isRefreshToken ? this.refreshSecret : this.jwtSecret) as JwtPayload;
            console.log('verify', verify);
            return verify;
        } catch (error) {
            throw new UnauthorizedError('Invalid token');
        }
    }
}
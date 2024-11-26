import {singleton} from "tsyringe";
import {AuthUtils} from "../middleware/auth/utils/auth.utils";
import {User} from "../models/user.model";
import {IUserResponse} from "../models/interfaces";
import {UnauthorizedError} from "../middleware/auth/exceptions/unauthorized.error";
import {RefreshTokenPayload} from "../middleware/auth/types/token.type";

interface LoginResponse {
    user: IUserResponse;
    accessToken: string;
    refreshToken: string;
}

@singleton()
export class AuthService {
    private authUtils: AuthUtils;
    private readonly MAX_SESSIONS = 5; // Limit concurrent sessions

    constructor() {
        this.authUtils = new AuthUtils();
    }

    async login(email: string, password: string, deviceInfo: string): Promise<LoginResponse> {
        const user = await User.findOne({email}).select('+password');

        if (!user) {
            throw new UnauthorizedError('Invalid credentials');
        }

        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            throw new UnauthorizedError(`Invalid credentials comparing password ${password} and ${user.password}`);
        }

        // Clean up old sessions if limit reached
        if (user.refreshTokens.length >= this.MAX_SESSIONS) {
            // Remove oldest session
            user.refreshTokens.shift();
        }

        // Generate tokens
        const accessToken = this.authUtils.generateAccessToken(user);
        const refreshToken = this.authUtils.generateRefreshToken(user, deviceInfo);

        // Add new session
        user.refreshTokens.push({
            token: refreshToken,
            deviceInfo,
            lastUsed: new Date()
        });

        await user.save();

        return {
            user: user.toObject() as IUserResponse,
            accessToken,
            refreshToken
        };
    }

    async refreshToken(token: string, deviceInfo: string): Promise<string> {
        const decoded: RefreshTokenPayload = this.authUtils.verifyToken(token, true) as RefreshTokenPayload;



        const user = await User.findOne({
            _id: decoded.id,
            'refreshTokens.token': token
        });

        if (!user) {
            throw new UnauthorizedError('Invalid refresh token');
        }

        // Find and update the session's last used time
        const tokenIndex = user.refreshTokens.findIndex(t => t.token === token);
        if (tokenIndex === -1) {
            throw new UnauthorizedError('Invalid refresh token');
        }

        // Verify device info matches
        if (user.refreshTokens[tokenIndex].deviceInfo !== deviceInfo) {
            // Potential token theft, invalidate all sessions
            await this.logoutAll(user.id);
            throw new UnauthorizedError('Security alert: Please login again');
        }

        user.refreshTokens[tokenIndex].lastUsed = new Date();
        await user.save();

        return this.authUtils.generateAccessToken(user);
    }


    async logout(userId: string, refreshToken: string): Promise<void> {
        await User.findByIdAndUpdate(userId, {
            $pull: {refreshTokens: {token: refreshToken}}
        });
    }

    async logoutAll(userId: string): Promise<void> {
        await User.findByIdAndUpdate(userId, {
            $set: {refreshTokens: []}
        });
    }

    async listSessions(userId: string) {
        const user = await User.findById(userId);
        return user?.refreshTokens.map(session => ({
            deviceInfo: session.deviceInfo,
            lastUsed: session.lastUsed
        }));
    }
}
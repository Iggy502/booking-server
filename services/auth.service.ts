import {singleton} from "tsyringe";
import {AuthUtils} from "../middleware/auth/utils/auth.utils";
import {User} from "../models/user.model";
import {IUserResponse, PasswordResetToken} from "../models/interfaces";
import {UnauthorizedError} from "../middleware/auth/exceptions/unauthorized.error";
import {RefreshTokenPayload} from "../middleware/auth/types/token.type";
import {InternalServerError, Unauthorized} from "http-errors";
import nodemailer from 'nodemailer';
import {getResetPasswordTemplateWithTokenValue} from "./util/password-reset-template";

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
            throw Unauthorized('Invalid credentials');
        }

        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            throw Unauthorized('Invalid credentials');
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

    async refreshToken(token: string, deviceInfo: string): Promise<{ accessToken: string, refreshToken: string }> {

        const decoded: RefreshTokenPayload = this.authUtils.verifyToken(token, true).payload as RefreshTokenPayload;

        const user = await User.findOne({
            _id: decoded.id,
            'refreshTokens.token': token
        });

        if (!user) {
            throw Unauthorized('Invalid refresh token');
        }

        // Find and update the session's last used time
        const tokenIndex = user.refreshTokens.findIndex(t => t.token === token);
        if (tokenIndex === -1) {
            throw Unauthorized('Invalid refresh token');
        }

        // Verify device info matches
        if (user.refreshTokens[tokenIndex].deviceInfo !== deviceInfo) {
            // Potential token theft, invalidate all sessions
            await this.logoutAll(user.id);
            throw Unauthorized('Invalid refresh token');
        }

        const refreshToken = this.authUtils.generateRefreshToken(user, deviceInfo);
        const accessToken = this.authUtils.generateAccessToken(user);

        user.refreshTokens[tokenIndex] = {
            token: refreshToken,
            deviceInfo,
            lastUsed: new Date()
        }

        await user.save();

        return {accessToken, refreshToken};

    }


    async logout(userId: string, refreshToken: string): Promise<void> {
        await User.findByIdAndUpdate(userId, {
            $pull: {refreshTokens: {token: refreshToken}}
        });
    }

    async initResetPassword(email: string): Promise<void> {


        const user = await User.findOne({email});

        if (!user) {
            throw Unauthorized('User Not Found');
        }

        // Generate reset token
        const resetToken = this.authUtils.generatePasswordResetToken();

        const userUpdated = await User.findByIdAndUpdate(user.id, {passwordResetToken: resetToken});

        if (!userUpdated) {
            throw InternalServerError('Failed to generate reset token');
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const mailOptions = {
            from: '"No Reply" campspot-no-reply@gmail.com>',
            to: email,
            subject: 'Password Reset',
            html: getResetPasswordTemplateWithTokenValue(resetToken.token)
        };

        await transporter.sendMail(mailOptions);

    }
    async logoutAll(userId: string): Promise<void> {
        await User.findByIdAndUpdate(userId, {
            $set: {refreshTokens: []}
        });
    }

    async listSessions(userId: string) {
        try {
            const user = await User.findById(userId);
            return user?.refreshTokens.map(session => ({
                deviceInfo: session.deviceInfo,
                lastUsed: session.lastUsed
            }));
        } catch (error) {
            throw InternalServerError('Failed to list sessions');
        }
    }
}
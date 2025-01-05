import {Request, Response, Router} from 'express';
import {container, singleton} from "tsyringe";
import {AuthService} from '../services/auth.service';
import {AuthRequest} from '../middleware/auth/types/token.type';
import {AuthMiddleware} from '../middleware/auth/auth-middleware';
import {AuthUtils} from "../middleware/auth/utils/auth.utils";
import {BadRequest, Unauthorized} from "http-errors";
import {UserService} from "../services/user.service";

@singleton()
export class AuthController {
    authService: AuthService;
    userService: UserService;
    authMiddleware: AuthMiddleware;
    authUtils: AuthUtils;
    router: Router;

    // Cookie configuration
    private readonly REFRESH_TOKEN_COOKIE_NAME = 'refreshToken';
    private readonly COOKIE_OPTIONS = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Only send cookie over HTTPS in production
        sameSite: 'strict' as const,
        path: '/auth', // Restrict cookie to auth routes
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    };

    constructor() {
        this.authService = container.resolve(AuthService);
        this.userService = container.resolve(UserService);
        this.router = Router();
        this.authMiddleware = new AuthMiddleware();
        this.authUtils = new AuthUtils();
    }


    login = async (req: Request, res: Response) => {
        try {
            console.log("Login request received");
            const {email, password} = req.body;
            const deviceInfo = req.headers['user-agent'] || 'unknown';
            const result = await this.authService.login(email, password, deviceInfo);

            // Set refresh token as HTTP-only cookie
            res.cookie(
                this.REFRESH_TOKEN_COOKIE_NAME,
                result.refreshToken,
                this.COOKIE_OPTIONS
            );

            res.json({accessToken: result.accessToken});
        } catch (error: any) {
            res.status(error.status || 401).json(error);
        }
    };

    initiatePasswordReset = async (req: Request, res: Response) => {
        try {
            const {email} = req.body;

            if (!email) {
                throw BadRequest('Email is required');
            }

            await this.authService.initResetPassword(email);

            res.status(200).json({message: 'Password reset initiated successfully'});
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }
    }


    confirmResetPassword = async (req: Request, res: Response) => {
        const passwordResetToken = req.params.token;

        try {
            if (!passwordResetToken) {
                throw BadRequest('Token is required');
            }

            const {newPassword} = req.body;
            await this.userService.updateUserPassword(passwordResetToken, newPassword);

            res.status(200).json({message: 'Password reset successfully'});
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }
    }


    refreshToken = async (req: Request, res: Response) => {
        try {
            const refreshToken = req.cookies[this.REFRESH_TOKEN_COOKIE_NAME];
            if (!refreshToken) {
                throw Unauthorized('No refresh token provided');
            }

            const deviceInfo = req.headers['user-agent'] || 'unknown';
            const result = await this.authService.refreshToken(refreshToken, deviceInfo);


            // Set new refresh token as HTTP-only cookie
            res.cookie(
                this.REFRESH_TOKEN_COOKIE_NAME,
                result.refreshToken,
                this.COOKIE_OPTIONS
            );

            res.json({accessToken: result.accessToken});
        } catch (error: any) {
            res.status(error.status || 401).json(error);
        }
    };

    logout = async (req: AuthRequest, res: Response) => {
        try {
            const refreshToken = req.cookies[this.REFRESH_TOKEN_COOKIE_NAME];
            if (refreshToken) {
                await this.authService.logout(req.user!.id, refreshToken);
            }

        } catch (error) {
            console.error("Error logging out", error);
        } finally {
            // Clear the refresh token cookie
            res.clearCookie(this.REFRESH_TOKEN_COOKIE_NAME, {
                ...this.COOKIE_OPTIONS,
                maxAge: 0
            });
            //Client doesn't need to know if the logout was successful
            res.status(200).json({message: 'Logged out successfully'});
        }
    };

    logoutAll = async (req: AuthRequest, res: Response) => {
        try {
            await this.authService.logoutAll(req.user!.id);

            // Clear the refresh token cookie
            res.clearCookie(this.REFRESH_TOKEN_COOKIE_NAME, {
                ...this.COOKIE_OPTIONS,
                maxAge: 0
            });

            res.json({message: 'Logged out from all devices'});
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }
    };

    listSessions = async (req: AuthRequest, res: Response) => {
        try {
            const sessions = await this.authService.listSessions(req.user!.id);
            res.json(sessions);
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }
    };


    routes() {
        this.router.post('/login', this.login);
        this.router.post('/refresh-token', this.refreshToken);
        this.router.post('/initiate-password-reset', this.initiatePasswordReset);
        this.router.put('/password-reset-confirm/:token', this.confirmResetPassword);
        this.router.post('/logout', this.authMiddleware.authenticate, this.logout);
        this.router.post('/logout-all', this.authMiddleware.authenticate, this.logoutAll);
        this.router.get('/sessions', this.authMiddleware.authenticate, this.listSessions);

        return this.router;
    }
}
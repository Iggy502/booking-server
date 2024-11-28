import {Request, Response} from 'express';
import {Router} from 'express';
import {autoInjectable, container, singleton} from "tsyringe";
import {AuthService} from '../services/auth.service';
import {AuthRequest} from '../middleware/auth/types/token.type';
import {AuthMiddleware} from '../middleware/auth/auth-middleware';

@singleton()
export class AuthController {
    authService: AuthService;
    authMiddleware: AuthMiddleware;
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
        this.router = Router();
        this.authMiddleware = new AuthMiddleware();
    }

    /**
     * @swagger
     * /auth/login:
     *   post:
     *     summary: Login user
     *     description: Authenticate user and return access token in response, refresh token in HTTP-only cookie
     *     tags: [Auth]
     *     security: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/LoginRequest'
     *     responses:
     *       200:
     *         description: Login successful
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/AccessTokenResponse'
     *       401:
     *         description: Invalid credentials
     */
    login = async (req: Request, res: Response) => {
        try {
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
            res.status(401).json({message: error.message});
        }
    };

    /**
     * @swagger
     * /auth/refresh-token:
     *   post:
     *     summary: Refresh access token
     *     description: Get new access token using refresh token from HTTP-only cookie
     *     tags: [Auth]
     *     security: []
     *     responses:
     *       200:
     *         description: New access token generated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/RefreshTokenResponse'
     *       401:
     *         description: Invalid refresh token
     */
    refreshToken = async (req: Request, res: Response) => {
        try {
            const refreshToken = req.cookies[this.REFRESH_TOKEN_COOKIE_NAME];
            if (!refreshToken) {
                throw new Error('No refresh token provided');
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
            res.status(401).json({message: error.message});
        }
    };

    /**
     * @swagger
     * /auth/logout:
     *   post:
     *     summary: Logout user
     *     description: Invalidate refresh token and clear the cookie
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Logged out successfully
     */
    logout = async (req: AuthRequest, res: Response) => {
        try {
            const refreshToken = req.cookies[this.REFRESH_TOKEN_COOKIE_NAME];
            if (refreshToken) {
                await this.authService.logout(req.user!.id, refreshToken);
            }

            // Clear the refresh token cookie
            res.clearCookie(this.REFRESH_TOKEN_COOKIE_NAME, {
                ...this.COOKIE_OPTIONS,
                maxAge: 0
            });

            res.json({message: 'Logged out successfully'});
        } catch (error: any) {
            res.status(401).json({message: error.message});
        }
    };

    /**
     * @swagger
     * /auth/logout-all:
     *   post:
     *     summary: Logout from all devices
     *     description: Invalidate all refresh tokens and clear the current cookie
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Logged out from all devices
     */
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
            res.status(401).json({message: error.message});
        }
    };

    /**
     * @swagger
     * /auth/sessions:
     *   get:
     *     summary: List active sessions
     *     description: Get all active sessions for the current user
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: List of active sessions
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/SessionResponse'
     *       401:
     *         description: Unauthorized
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    listSessions = async (req: AuthRequest, res: Response) => {
        try {
            const sessions = await this.authService.listSessions(req.user!.id);
            res.json(sessions);
        } catch (error: any) {
            res.status(401).json({message: error.message});
        }
    };


    routes() {
        // Public routes
        this.router.post('/login', this.login);
        this.router.post('/refresh-token', this.refreshToken);

        // Protected routes
        this.router.post('/logout', this.authMiddleware.authenticate, this.logout);
        this.router.post('/logout-all', this.authMiddleware.authenticate, this.logoutAll);
        this.router.get('/sessions', this.authMiddleware.authenticate, this.listSessions);

        return this.router;
    }
}
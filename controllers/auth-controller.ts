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
     *     description: Authenticate user and return tokens
     *     tags: [Auth]
     *     security: []  # No security required for login
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
     *               $ref: '#/components/schemas/LoginResponse'
     *       401:
     *         description: Invalid credentials
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    login = async (req: Request, res: Response) => {
        try {
            const {email, password} = req.body;
            const deviceInfo = req.headers['user-agent'] || 'unknown';
            const result = await this.authService.login(email, password, deviceInfo);
            res.json(result);
        } catch (error: any) {
            res.status(401).json({message: error.message});
        }
    };

    /**
     * @swagger
     * /auth/refresh-token:
     *   post:
     *     summary: Refresh access token
     *     description: Get new access token using refresh token
     *     tags: [Auth]
     *     security: []  # No security required for refresh token
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/RefreshTokenRequest'
     *     responses:
     *       200:
     *         description: New access token generated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/RefreshTokenResponse'
     *       401:
     *         description: Invalid refresh token
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    refreshToken = async (req: Request, res: Response) => {
        try {
            const {refreshToken} = req.body;
            const deviceInfo = req.headers['user-agent'] || 'unknown';
            const result = await this.authService.refreshToken(refreshToken, deviceInfo);
            res.json(result);
        } catch (error: any) {
            res.status(401).json({message: error.message});
        }
    };

    /**
     * @swagger
     * /auth/logout:
     *   post:
     *     summary: Logout user
     *     description: Invalidate refresh token for current session
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/LogoutRequest'
     *     responses:
     *       200:
     *         description: Logged out successfully
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/MessageResponse'
     *       401:
     *         description: Unauthorized
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    logout = async (req: AuthRequest, res: Response) => {
        try {
            const {refreshToken} = req.body;
            await this.authService.logout(req.user!.id, refreshToken);
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
     *     description: Invalidate all refresh tokens for the user
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Logged out from all devices
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/MessageResponse'
     *       401:
     *         description: Unauthorized
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    logoutAll = async (req: AuthRequest, res: Response) => {
        try {
            await this.authService.logoutAll(req.user!.id);
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

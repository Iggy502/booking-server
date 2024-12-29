//Controller for user
import {Request, Response, Router} from 'express';
import {UserService} from '../services/user.service';
import {IUserCreate, UserRole} from '../models/interfaces';
import {container, singleton} from "tsyringe";
import {AuthMiddleware} from "../middleware/auth/auth-middleware";
import {AuthRequest} from "../middleware/auth/types/token.type";
import {Forbidden} from "http-errors";


@singleton()
export class UserController {
    userService: UserService;
    authMiddleware: AuthMiddleware;
    router: Router;

    constructor() {
        this.userService = container.resolve(UserService);
        this.router = Router();
        this.authMiddleware = new AuthMiddleware();
    }

    /**
     * @swagger
     * /users:
     *   post:
     *     summary: Create a user
     *     description: Create a user
     *     tags: [User]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/UserCreate'
     *     responses:
     *       201:
     *         description: User created
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UserResponse'
     *       500:
     *         description: Internal Server Error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *                   example: Internal Server Error
     */
    createUser = async (req: Request, res: Response) => {
        try {
            const userData: IUserCreate = req.body;
            const user = await this.userService.createUser(userData);
            res.status(201).json(user);
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }

    };

    /**
     * @swagger
     * /users/{id}:
     *   get:
     *     summary: Get a user by id
     *     description: Get a user by id
     *     tags: [User]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: User found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UserResponse'
     *       500:
     *         description: Internal Server Error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *                   example: Internal Server Error
     */
    getUserById = async (req: Request, res: Response) => {
        const userId = req.params.id;

        try {
            const user = await this.userService.getUserById(userId);
            res.status(200).json(user);
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }
    };

    /**
     * @swagger
     * /users/{id}:
     *   put:
     *     summary: Update a user
     *     description: Update a user
     *     tags: [User]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *            $ref: '#/components/schemas/UserUpdate'
     *     responses:
     *       200:
     *         description: User updated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UserResponse'
     *       404:
     *          description: User not found
     *          content:
     *            application/json:
     *              schema:
     *              type: object
     *              properties:
     *                 error:
     *                   type: string
     *                   example: User not found
     *       500:
     *         description: Internal Server Error
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *                   example: Internal Server Error
     */
    updateUser = async (req: AuthRequest, res: Response) => {

        const currentAuthenticatedUserId = req.user?.id!;

        if (req.params.id !== currentAuthenticatedUserId && !req.user?.roles.includes(UserRole.ADMIN)) {
            throw Forbidden('Only admins can update other users');
        }

        const userId = req.params.id;
        const userData: Partial<IUserCreate> = req.body;
        try {
            const user = await this.userService.updateUser(userId, userData);
            res.json(user);
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }
    };

    /**
     * @swagger
     * /users/{id}:
     *   delete:
     *     summary: Delete a user
     *     description: Delete a user
     *     tags: [User]
     *     parameters:
     *       - in: path
     *         name: id
     *         required: true
     *         schema:
     *           type: string
     *     responses:
     *       200:
     *         description: User deleted
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/UserResponse'
     *       404:
     *         description: User not found
     *         content:
     *           application/json:
     *             schema:
     *             type: object
     *             properties:
     *             error:
     *                type: string
     *                example: User not found     *
     */
    deleteUser = async (req: Request, res: Response) => {
        try {
            const userId = req.params.id;
            const user = await this.userService.deleteUser(userId);
            res.json(user).status(200);
        } catch (error: any) {
            res.status(error.status).json({error: error.message});
        }
    };

    routes() {
        this.router.post('/', this.createUser);
        this.router.get('/:id', this.getUserById);
        this.router.put('/:id', this.authMiddleware.authenticate, this.updateUser);
        this.router.delete('/:id', this.authMiddleware.authenticate, this.authMiddleware.requireRoles([UserRole.ADMIN]), this.deleteUser);
        return this.router;
    }
}
//Controller for user
import {Request, Response, Router} from 'express';
import {UserService} from '../services/user.service';
import {IUserCreate} from '../models/interfaces';
import {container, singleton} from "tsyringe";


@singleton()
export class UserController {
    userService: UserService;
    router: Router;

    constructor() {
        this.userService = container.resolve(UserService);
        this.router = Router();
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
        const userData: IUserCreate = req.body;
        const user = await this.userService.createUser(userData);
        res.status(201).json(user);
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
        const user = await this.userService.getUserById(userId);
        res.json(user);
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
     *             type: object
     *             properties:
     *               email:
     *                 type: string
     *               name:
     *                 type: string
     *               phone:
     *                 type: string
     *               password:
     *                 type: string
     *     responses:
     *       200:
     *         description: User updated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/User'
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
    updateUser = async (req: Request, res: Response) => {
        const userId = req.params.id;
        const userData: Partial<IUserCreate> = req.body;
        const user = await this.userService.updateUser(userId, userData);
        res.json(user);
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
     *               $ref: '#/components/schemas/User'
     *
     */
    deleteUser = async (req: Request, res: Response) => {
        try {
            const userId = req.params.id;
            const user = await this.userService.deleteUser(userId);
            res.json(user).status(200);
        } catch (error) {
            console.log(error);
            res.status(500).json({error: 'Internal Server Error'});
        }
    };

    routes() {
        this.router.post('/', this.createUser);
        this.router.get('/:id', this.getUserById);
        this.router.put('/:id', this.updateUser);
        this.router.delete('/:id', this.deleteUser);
        return this.router;
    }
}
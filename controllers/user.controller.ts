import {Request, Response, Router} from 'express';
import {UserService} from '../services/user.service';
import {IUserCreate, UserRole} from '../models/interfaces';
import {container, singleton} from "tsyringe";
import {AuthMiddleware} from "../middleware/auth/auth-middleware";
import {AuthRequest} from "../middleware/auth/types/token.type";
import {BadRequest, Forbidden} from "http-errors";
import {MessageRequest} from "../models/interfaces/chat.types";


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


    createUser = async (req: Request, res: Response) => {
        try {
            const userData: IUserCreate = req.body;
            const user = await this.userService.createUser(userData);
            res.status(201).json(user);
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }
    };

    getUserById = async (req: Request, res: Response) => {
        const userId = req.params.id;

        try {
            const user = await this.userService.getUserById(userId);
            res.status(200).json(user);
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }
    };

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

    saveChatMessage = async (req: AuthRequest, res: Response) => {
        const message: MessageRequest = req.body;

        if (!message) {
            throw BadRequest('Message is required');
        }

        const currUserId = req.user?.id!;

        try {
            await this.userService.saveChatMessageForConversationWithUser(message, currUserId);
            res.status(200).json({message: 'Message saved successfully'});
        } catch (error: any) {
            res.status(error.status || 500).json(error);

        }
    }

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
        this.router.post('/chat/message', this.authMiddleware.authenticate, this.saveChatMessage);
        this.router.put('/:id', this.authMiddleware.authenticate, this.updateUser);
        this.router.delete('/:id', this.authMiddleware.authenticate, this.authMiddleware.requireRoles([UserRole.ADMIN]), this.deleteUser);
        return this.router;
    }

}
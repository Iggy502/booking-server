//Controller for user
import {Request, Response} from 'express';
import {UserService} from '../services/user.service';
import {IUserCreate, IUserResponse} from '../models/interfaces';
import {Router} from 'express';
import {autoInjectable} from "tsyringe";

@autoInjectable()
export class UserController {
    userService: UserService;
    router: Router;

    constructor(userService: UserService) {
        this.userService = userService;
        this.router = Router();
    }

    async createUser(req: Request, res: Response) {
        const userData: IUserCreate = req.body;
        const user = await this.userService.createUser(userData);
        res.status(201).json(user);
    }

    async getUserById(req: Request, res: Response) {
        const userId = req.params.id;
        const user = await this.userService.getUserById(userId);
        res.json(user);
    }

    async updateUser(req: Request, res: Response) {
        const userId = req.params.id;
        const userData: Partial<IUserCreate> = req.body;
        const user = await this.userService.updateUser(userId, userData);
        res.json(user);
    }

    async deleteUser(req: Request, res: Response) {
        const userId = req.params.id;
        const user = await this.userService.deleteUser(userId);
        res.json(user);
    }

    routes() {
        this.router.post('/', this.createUser);
        this.router.get('/:id', this.getUserById);
        this.router.put('/:id', this.updateUser);
        this.router.delete('/:id', this.deleteUser);
        return this.router;
    }

}



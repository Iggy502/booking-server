//Controller for user
import {Request, Response} from 'express';
import {UserService} from '../services/user.service';
import {IUserCreate, IUserResponse} from '../models/interfaces';

export class UserController {
    static async createUser(req: Request, res: Response) {
        const userData: IUserCreate = req.body;
        const user = await UserService.createUser(userData);
        res.status(201).json(user);
    }

    static async getUserById(req: Request, res: Response) {
        const userId = req.params.id;
        const user = await UserService.getUserById(userId);
        res.json(user);
    }

    static async updateUser(req: Request, res: Response) {
        const userId = req.params.id;
        const userData: Partial<IUserCreate> = req.body;
        const user = await UserService.updateUser(userId, userData);
        res.json(user);
    }

    static async deleteUser(req: Request, res: Response) {
        const userId = req.params.id;
        const user = await UserService.deleteUser(userId);
        res.json(user);
    }

}



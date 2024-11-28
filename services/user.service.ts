// Objective: User service to handle user operations
import {User} from '../models/user.model';
import {IUserCreate, IUserResponse} from '../models/interfaces';
import {singleton} from 'tsyringe';
import {HttpError} from "./exceptions/http-error";


@singleton()
export class UserService {
    async createUser(userData: IUserCreate): Promise<IUserResponse> {
        const user = await User.create(userData);
        return <IUserResponse>user.toObject();
    }

    async getUserById(userId: string): Promise<IUserResponse> {
        const user = await User.findById(userId);

        if (!user) {
            throw new HttpError(404, 'User not found');
        }

        return <IUserResponse>user.toObject();
    }

    async updateUser(userId: string, userData: Partial<IUserCreate>): Promise<IUserResponse> {
        const user = await User.findByIdAndUpdate(userId, userData, {new: true});

        if (!user) {
            throw new HttpError(404, 'User not found');
        }

        return <IUserResponse>user.toObject();
    }

    async deleteUser(userId: string): Promise<IUserResponse> {
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            throw new HttpError(404, 'User not found');
        }

        return <IUserResponse>user.toObject();
    }
}

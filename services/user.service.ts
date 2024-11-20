// Objective: User service to handle user operations
import {User} from '../models/user.model';
import {IUserResponse, IUserCreate} from '../models/interfaces';
import {injectable} from 'tsyringe';

//https://github.com/kriscfoster/typescript-dependency-injection/blob/master/src/book/BookController.ts

@injectable()
export class UserService {
    async createUser(userData: IUserCreate): Promise<IUserResponse> {
        const user = await User.create(userData);
        return <IUserResponse>user.toObject();
    }

    async getUserById(userId: string): Promise<IUserResponse> {
        const user = await User.findById(userId);
        return <IUserResponse>user?.toObject();
    }

    async updateUser(userId: string, userData: Partial<IUserCreate>): Promise<IUserResponse> {
        const user = await User.findByIdAndUpdate(userId, userData, {new: true});
        return <IUserResponse>user?.toObject();
    }

    async deleteUser(userId: string): Promise<IUserResponse> {
        const user = await User.findByIdAndDelete(userId);
        return <IUserResponse>user?.toObject();
    }
}
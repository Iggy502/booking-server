// Objective: User service to handle user operations
import {User} from '../models/user.model';
import {IUserDocument, IUserResponse, IUserCreate} from '../models/interfaces';


export class UserService {
    static async createUser(userData: IUserCreate): Promise<IUserResponse> {
        const user = await User.create(userData);
        return <IUserResponse>user.toObject();
    }

    static async getUserById(userId: string): Promise<IUserResponse> {
        const user = await User.findById(userId);
        return <IUserResponse>user?.toObject();
    }

    static async updateUser(userId: string, userData: Partial<IUserCreate>): Promise<IUserResponse> {
        const user = await User.findByIdAndUpdate(userId, userData, {new: true});
        return <IUserResponse>user?.toObject();
    }

    static async deleteUser(userId: string): Promise<IUserResponse> {
        const user = await User.findByIdAndDelete(userId);
        return <IUserResponse>user?.toObject();
    }
}
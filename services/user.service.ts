// Objective: User service to handle user operations
import {User} from '../models/user.model';
import {IUserCreate, IUserDocument, IUserResponse, IUserUpdate} from '../models/interfaces';
import {container, singleton} from 'tsyringe';
import {BadRequest, NotFound} from "http-errors";
import {ImageUploadService} from "./image.upload.service";


@singleton()
export class UserService {

    private imageUploadService!: ImageUploadService;


    async createUser(userData: IUserCreate): Promise<IUserResponse> {
        const findUserWithExistingEmailOrPhone = await User.findOne({
            $or: [
                {email: userData.email},
                {phone: userData.phone}
            ]
        });

        if (findUserWithExistingEmailOrPhone) {
            throw new BadRequest('User with this email or phone already exists');
        }

        const user = await User.create(userData);
        return this.mapToPropertyResponse(user);
    }

    // Lazy getter for imageUploadService
    // Avoids circular dependency issue
    private getImageUploadService(): ImageUploadService {
        if (!this.imageUploadService) {
            this.imageUploadService = container.resolve(ImageUploadService);
        }
        return this.imageUploadService;
    }

    async getUserById(userId: string): Promise<IUserResponse> {
        const user = await User.findById(userId);

        if (!user) {
            throw NotFound('User not found');
        }

        return this.mapToPropertyResponse(user);
    }

    async updateUser(userId: string, userData: IUserUpdate): Promise<IUserResponse> {
        const user = await User.findByIdAndUpdate(userId, userData, {new: true});

        if (!user) {
            throw NotFound('User not found');
        }

        return this.mapToPropertyResponse(user);
    }

    async deleteUser(userId: string): Promise<IUserResponse> {
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            throw NotFound('User not found');
        }

        return this.mapToPropertyResponse(user);
    }

    async updateUserImages(userId: string, newProfilePicPath: string): Promise<IUserResponse> {

        const user = await User.findByIdAndUpdate(userId, {profilePicturePath: newProfilePicPath}, {new: true});

        if (!user) {
            throw NotFound('User not found');
        }

        return this.mapToPropertyResponse(user);

    }


    private mapToPropertyResponse(user: IUserDocument): IUserResponse {
        const userResponse = <IUserResponse>user.toObject();

        const imagesPathsFullUrl = userResponse.profilePicturePath ?
            this.getImageUploadService().convertPathToUrl(userResponse.profilePicturePath) : null;

        if (imagesPathsFullUrl) {
            return {...userResponse, profilePicturePath: imagesPathsFullUrl};
        }

        return userResponse;
    }
}

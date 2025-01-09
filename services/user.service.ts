import {User} from '../models/user.model';
import {IBookingDocument, IUserCreate, IUserDocument, IUserResponse, IUserUpdate} from '../models/interfaces';
import {container, singleton} from 'tsyringe';
import {BadRequest, Forbidden, NotFound} from "http-errors";
import {ImageConversionUtil} from "./util/image/image-conversion-util";
import {MessageRequest} from "../models/interfaces/chat.types";
import {BookingService} from "./booking.service";
import {PropertyService} from "./property.service";


@singleton()
export class UserService {

    private bookingService: BookingService;
    private propertyService: PropertyService;

    constructor() {
        this.bookingService = container.resolve(BookingService);
        this.propertyService = container.resolve(PropertyService);

    }

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
        return this.mapToUserResponse(user);
    }

    async getUserById(userId: string): Promise<IUserResponse> {
        const user = await User.findById(userId);

        if (!user) {
            throw NotFound('User not found');
        }

        return this.mapToUserResponse(user);
    }

    async updateUserPassword(token: string, newPassword: string): Promise<void> {
        if (!token) {
            throw BadRequest('Invalid token');
        }

        const user = await User.findOne({'passwordResetToken.token': token});

        if (!user) {
            throw BadRequest('Invalid or expired token');
        }

        const resetToken = user.passwordResetToken!;

        if (resetToken && resetToken.expires < new Date()) {
            throw BadRequest('Token expired');
        }

        await User.findByIdAndUpdate(user.id, {passwordResetToken: null, password: newPassword});
    }

    async updateUser(userId: string, userData: IUserUpdate): Promise<IUserResponse> {
        const findUserWithExistingEmailOrPhone = await User.findOne({
            $and: [
                {_id: {$ne: userId}},
                {$or: [{email: userData.email}, {phone: userData.phone}]}
            ]
        });

        if (findUserWithExistingEmailOrPhone) {
            throw new BadRequest('User with this email or phone already exists');
        }

        const user = await User.findByIdAndUpdate(userId, userData, {new: true});

        if (!user) {
            throw NotFound('User not found');
        }

        return this.mapToUserResponse(user);
    }

    async deleteUser(userId: string): Promise<IUserResponse> {
        const user = await User.findByIdAndDelete(userId);

        if (!user) {
            throw NotFound('User not found');
        }

        return this.mapToUserResponse(user);
    }

    async updateUserImages(userId: string, newProfilePicPath: string): Promise<IUserResponse> {

        const user = await User.findByIdAndUpdate(userId, {profilePicturePath: newProfilePicPath}, {new: true});

        if (!user) {
            throw NotFound('User not found');
        }

        return this.mapToUserResponse(user);

    }


    public mapToUserResponse(user: IUserDocument): IUserResponse {
        const userResponse = <IUserResponse>user.toObject();

        if (userResponse.profilePicturePath) {
            const imagesPathsFullUrl =
                ImageConversionUtil.convertPathToUrl(userResponse.profilePicturePath, process.env.AWS_S3_BUCKET || '');

            if (imagesPathsFullUrl) {
                return {...userResponse, profilePicturePath: imagesPathsFullUrl};
            }
        }

        return userResponse;
    }

    async saveChatMessageForConversationWithUser(message: MessageRequest, userId: string): Promise<void> {
        const bookingForConversation: IBookingDocument | null =
            await this.bookingService.findMatchingBookingForConversation(message.conversationId);

        if (!bookingForConversation) {
            throw NotFound('Booking not found for conversation');
        }

        const relatedProperty = await this.propertyService.getPropertyById(bookingForConversation.property.toString());

        if (!relatedProperty) {
            throw NotFound('Property not found for booking linked to this conversation. Cannot verify the owner...');
        }

        if (relatedProperty.owner.toString() !== userId && bookingForConversation.guest.toString() !== userId) {
            throw Forbidden('You do not have permission to send messages for this booking');
        }

        await this.bookingService.saveChatMessageForConversationAndRelatedBooking(message);

    }
}

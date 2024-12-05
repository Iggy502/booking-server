import {container, injectable} from "tsyringe";
import {S3Client, PutObjectCommand} from "@aws-sdk/client-s3";
import {Property} from "../models/property.model";
import {User} from "../models/user.model";
import {IPropertyResponse, IUserDocument, IUserResponse} from "../models/interfaces";
import {HttpError} from "./exceptions/http-error";
import {PropertyService} from "./property.service";
import {UserService} from "./user.service";

export enum UploadType {
    PROPERTY = 'properties',
    PROFILE = 'profiles'
}

interface PropertyUploadOptions {
    propertyId: string;
}

interface ProfileUploadOptions {
    userId: string;
}

@injectable()
export class ImageUploadService {
    private s3Client: S3Client;
    private bucket: string;
    private propertyService: PropertyService;
    private userService: UserService;

    constructor() {
        this.bucket = process.env.AWS_S3_BUCKET || '';
        this.s3Client = new S3Client({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
            }
        });
        this.propertyService = container.resolve(PropertyService);
        this.userService = container.resolve(UserService);
    }

    async uploadImage(
        file: Express.Multer.File,
        type: UploadType,
        options?: PropertyUploadOptions | ProfileUploadOptions
    ): Promise<string> {
        try {
            if (Object.values(UploadType).indexOf(type) === -1) {
                throw new Error('Invalid upload type');
            }

            let filePath: string;
            let fileName: string;

            switch (type) {
                case UploadType.PROPERTY:
                    if (!(<PropertyUploadOptions>options)?.propertyId) {
                        throw new Error('Property ID is required for property images');
                    }
                    fileName = this.createPropertyImageFileName(file.originalname);
                    filePath = `${UploadType.PROPERTY}/${(<PropertyUploadOptions>options).propertyId}/${fileName}`;
                    break;
                case UploadType.PROFILE:
                    if (!(<ProfileUploadOptions>options)?.userId) {
                        throw new Error('User ID is required for profile images');
                    }
                    fileName = this.createProfileImageFileName(file.originalname);
                    filePath = `${UploadType.PROFILE}/${(<ProfileUploadOptions>options).userId}/${fileName}`;
                    break;
                default:
                    throw new Error('Invalid upload type');
            }

            const command = new PutObjectCommand({
                Bucket: this.bucket,
                Key: filePath,
                Body: file.buffer,
                ContentType: file.mimetype
            });

            await this.s3Client.send(command);

            const imageUrl = `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${filePath}`;


            return imageUrl;
        } catch (error) {
            console.error('Error uploading to S3:', error);
            throw new Error('Failed to upload image');
        }
    }

    convertPathToUrl(path: string): string {
        return `https://${this.bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${path}`;
    }

    private createPropertyImageFileName(originalName: string): string {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const extension = originalName.split('.').pop();
        return `${timestamp}-${randomString}.${extension}`;
    }

    private createProfileImageFileName(originalName: string): string {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const extension = originalName.split('.').pop();
        return `${timestamp}-${randomString}.${extension}`;
    }


    uploadProfileImage = async (file: Express.Multer.File, options: ProfileUploadOptions): Promise<IUserResponse> => {
        let url = await this.uploadImage(file, UploadType.PROFILE, options);
        return this.userService.updateUser(options.userId, {profilePicturePath: url});
    };


    uploadPropertyImages = async (files: Express.Multer.File[], PROPERTY: UploadType, options: PropertyUploadOptions): Promise<IPropertyResponse> => {
        let urls = await Promise.all(files.map(async (file) => {
            return this.uploadImage(file, UploadType.PROPERTY, options);
        }));
        return this.propertyService.updateProperty(options.propertyId, {imagePaths: urls});
    };
}
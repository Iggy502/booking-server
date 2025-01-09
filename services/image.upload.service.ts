import {container, injectable} from "tsyringe";
import {DeleteObjectsCommand, ListObjectsV2Command, PutObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {IPropertyResponse, IUserResponse} from "../models/interfaces";
import {PropertyService} from "./property.service";
import {UserService} from "./user.service";
import {BadRequest, InternalServerError} from "http-errors";
import {ImageConversionUtil} from "./util/image/image-conversion-util";

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
    private readonly bucket: string = process.env.AWS_S3_BUCKET || '';

    private s3Client: S3Client;
    private propertyService: PropertyService;
    private userService: UserService;

    constructor() {
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
                throw BadRequest('Invalid upload type');
            }

            let filePath: string;
            let fileName: string;

            switch (type) {
                case UploadType.PROPERTY:
                    if (!(<PropertyUploadOptions>options)?.propertyId) {
                        throw BadRequest('Property ID is required for property images');
                    }
                    fileName = this.createPropertyImageFileName(file.originalname);
                    filePath = `${UploadType.PROPERTY}/${(<PropertyUploadOptions>options).propertyId}/${fileName}`;
                    break;
                case UploadType.PROFILE:
                    if (!(<ProfileUploadOptions>options)?.userId) {
                        throw BadRequest('User ID is required for profile images');
                    }
                    fileName = this.createProfileImageFileName(file.originalname);
                    filePath = `${UploadType.PROFILE}/${(<ProfileUploadOptions>options).userId}/${fileName}`;
                    break;
                default:
                    throw BadRequest('Invalid upload type');
            }

            const command = new PutObjectCommand({
                Bucket: this.bucket,
                Key: filePath,
                Body: file.buffer,
                ContentType: file.mimetype
            });

            const res = await this.s3Client.send(command);
            console.log('Uploaded image to S3:', res);

            return filePath;
        } catch (error) {
            console.error('Error uploading to S3:', error);
            throw error;
        }
    }


    private createPropertyImageFileName = (originalName: string): string => {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const extension = originalName.split('.').pop();
        return `${timestamp}-${randomString}.${extension}`;
    };

    private createProfileImageFileName = (originalName: string): string => {
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 8);
        const extension = originalName.split('.').pop();
        return `${timestamp}-${randomString}.${extension}`;
    };


    uploadProfileImage = async (file: Express.Multer.File, options: ProfileUploadOptions): Promise<IUserResponse> => {
        const imagePath = await this.uploadImage(file, UploadType.PROFILE, options);
        return this.userService.updateUserImages(options.userId, imagePath);
    };


    uploadPropertyImages = async (files: Express.Multer.File[], options: PropertyUploadOptions): Promise<IPropertyResponse> => {
        const imagePaths = await Promise.all(files.map(async (file) => {
            return this.uploadImage(file, UploadType.PROPERTY, options);
        }));
        return this.propertyService.updatePropertyImages(options.propertyId, imagePaths);
    };

    async deletePropertyImage(propertyId: string, imagePathString: string) {
        return this.deleteImage(ImageConversionUtil.convertUrlToPath(imagePathString, this.bucket)).then(() => {
            return this.propertyService.removePropertyImage(propertyId, imagePathString);
        });
    }

    async deleteProfileImage(userId: string, imagePathString: string) {
        return this.deleteImage(ImageConversionUtil.convertUrlToPath(imagePathString, this.bucket)).then(() => {
            return this.userService.updateUser(userId, {profilePicturePath: ''});
        });
    }

    async deleteImage(path: string) {
        const command = new DeleteObjectsCommand({
            Bucket: this.bucket,
            Delete: {
                Objects: [
                    {Key: path}
                ],
                Quiet: false
            }
        });

        try {
            const response = await this.s3Client.send(command);
            console.log('Deleted image from S3:', response);
        } catch (error) {
            console.error('Error deleting image from S3:', error);
            throw InternalServerError('Failed to delete image');
        }

        const listCommand = new ListObjectsV2Command({
            Bucket: "bookingimages502",
            Prefix: path
        });

        const listResponse = await this.s3Client.send(listCommand);
    }
}
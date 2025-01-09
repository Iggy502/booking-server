import {Request, Response, Router} from 'express';
import {container, singleton} from "tsyringe";
import {ImageUploadService} from "../services/image.upload.service";
import {AuthMiddleware} from "../middleware/auth/auth-middleware";
import multer from "multer";
import {PropertyService} from "../services/property.service";
import {BadRequest, Forbidden, Unauthorized} from "http-errors";
import {AuthRequest} from "../middleware/auth/types/token.type";
import {UserRole} from "../models/interfaces";

@singleton()
export class ImageController {
    imageUploadService: ImageUploadService;
    authMiddleware: AuthMiddleware;
    propertyService: PropertyService;
    router: Router;

    readonly MAX_IMAGES = 6;

    constructor() {
        this.imageUploadService = container.resolve(ImageUploadService);
        this.propertyService = container.resolve(PropertyService);
        this.authMiddleware = new AuthMiddleware();
        this.router = Router();
    }

    private upload = multer({
        storage: multer.memoryStorage(),
        limits: {fileSize: 5 * 1024 * 1024},
        fileFilter: (req, file, cb) => {
            if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
                cb(new Error('Invalid file type. Only JPEG, PNG and WebP are allowed'));
                return;
            }
            cb(null, true);
        }
    });

    uploadPropertyImages = async (req: Request, res: Response): Promise<void> => {
        try {
            const files = req.files as Express.Multer.File[];
            const propertyId = req.params.propertyId;

            const currProperty = await this.propertyService.getPropertyById(propertyId);
            const currImageCount = currProperty.imagePaths?.length || 0;

            if (currImageCount + files.length > this.MAX_IMAGES) {
                throw BadRequest('Cannot upload more than 6 images');
            }

            if (!files || files.length === 0) {
                res.status(400).json({error: 'No files provided'});
                return;
            }

            const propertyWithAddedImages = await this.imageUploadService.uploadPropertyImages(files, {propertyId});

            res.status(200).json(propertyWithAddedImages);
        } catch (error: any) {
            res.status(error | 500).json(error);
        }
    };


    getPropertyImagesForProperty = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const propertyId = req.params.propertyId;

            if (!propertyId) {
                throw BadRequest('Property ID is required');
            }

            const userId = req.user!.id;
            const propertyResponse = await this.propertyService.getPropertyById(propertyId);

            if (propertyResponse.owner.toString() !== userId) {
                throw Forbidden('You do not have permission to view these images');
            }

            res.status(200).json(propertyResponse.imagePaths);
        } catch (error: any) {
            res.status(error | 500).json(error);
        }
    }

    uploadProfileImage = async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const file = req.file;

            const userId = req.params.userId;
            const currAuthenticatedUserId = req.user!.id;

            if (!currAuthenticatedUserId) {
                throw Unauthorized('Not authorized');
            }

            if (currAuthenticatedUserId !== userId && !req.user?.roles.includes(UserRole.ADMIN)) {
                throw Forbidden('Only admins can upload profile images for other users');
            }

            if (!file) {
                throw BadRequest('No file provided');
            }

            const url = await this.imageUploadService.uploadProfileImage(file, {userId: req.user!.id});
            res.status(200).json({url});
        } catch (error: any) {
            res.status(error | 500).json(error);
        }
    };

    deletePropertyImage = async (req: Request, res: Response): Promise<void> => {
        try {
            const {propertyId, imagePath} = req.body;

            if (!propertyId || !imagePath) {
                throw BadRequest('Property ID and image path are required');
            }

            const bucketImageRemove = new Promise<void>((resolve, reject) => {
                this.imageUploadService.deletePropertyImage(propertyId, imagePath)
                    .then(() => resolve())
                    .catch((error) => {
                        console.error('Error deleting image on AWS, cleanup later...', error);
                        reject(error);
                    });
            });

            await Promise.all([bucketImageRemove, this.propertyService.removePropertyImage(propertyId, imagePath)]);
            res.status(200).json({message: 'Image deleted successfully'});
        } catch (error: any) {
            res.status(error | 500).json(error);
        }
    }

    deleteProfileImage = async (req: Request, res: Response): Promise<void> => {
        try {
            const {userId, imageId} = req.body;

            if (!userId || !imageId) {
                res.status(400).json({error: 'User ID is required'});
                return;
            }
            await this.imageUploadService.deleteProfileImage(userId, imageId);
            res.status(200).json({message: 'Profile image deleted successfully'});
        } catch (error: any) {
            res.status(500).json({error: error.message});
        }
    }

    routes() {
        this.router.post(
            '/property/:propertyId',
            this.authMiddleware.authenticate,
            this.upload.array('images', this.MAX_IMAGES),
            this.uploadPropertyImages
        );

        this.router.post(
            '/profile/:userId',
            this.authMiddleware.authenticate,
            this.upload.single('image'),
            this.uploadProfileImage
        );

        this.router.delete(
            '/property',
            this.authMiddleware.authenticate,
            this.deletePropertyImage
        );

        this.router.get(
            '/property/:propertyId',
            this.authMiddleware.authenticate,
            this.getPropertyImagesForProperty
        );

        return this.router;
    }
}
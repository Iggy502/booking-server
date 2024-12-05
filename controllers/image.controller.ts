// src/controllers/image.controller.ts
import {Request, Response, Router} from 'express';
import {container, singleton} from "tsyringe";
import {ImageUploadService, UploadType} from "../services/image.upload.service";
import {AuthMiddleware} from "../middleware/auth/auth-middleware";
import multer from "multer";
import {PropertyService} from "../services/property.service";

@singleton()
export class ImageController {
    imageUploadService: ImageUploadService;
    authMiddleware: AuthMiddleware;
    PropertyService: PropertyService;
    router: Router;

    constructor() {
        this.imageUploadService = container.resolve(ImageUploadService);
        this.PropertyService = container.resolve(PropertyService);
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
            const propertyId = req.params.propertyId; // Get from URL params

            if (!files || files.length === 0) {
                res.status(400).json({error: 'No files provided'});
                return;
            }

            const uploadPromises =
                this.imageUploadService.uploadPropertyImages(files, UploadType.PROPERTY, {propertyId});


            // res.status(200).json({urls});
        } catch (error: any) {
            res.status(500).json({error: error.message});
        }
    };

    uploadProfileImage = async (req: Request, res: Response): Promise<void> => {
        try {
            const file = req.file;
            if (!file) {
                res.status(400).json({error: 'No file provided'});
                return;
            }

            const url = await this.imageUploadService.uploadImage(file, UploadType.PROFILE);
            res.status(200).json({url});
        } catch (error: any) {
            res.status(500).json({error: error.message});
        }
    };

    routes() {
        this.router.post(
            '/property/:propertyId',  // Updated route to include propertyId
            this.authMiddleware.authenticate,
            this.upload.array('images', 5),
            this.uploadPropertyImages
        );

        this.router.post(
            '/profile',
            this.authMiddleware.authenticate,
            this.upload.single('image'),
            this.uploadProfileImage
        );

        return this.router;
    }
}
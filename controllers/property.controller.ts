//property.controller.ts
import {Request, Response, Router} from 'express';
import {container, singleton} from "tsyringe";
import {PropertyService} from "../services/property.service";
import {IPropertyCreate, UserRole} from '../models/interfaces';
import {AuthMiddleware} from "../middleware/auth/auth-middleware";
import {AuthRequest} from "../middleware/auth/types/token.type";
import {BadRequest, Forbidden, Unauthorized} from "http-errors";
import {RatingService} from "../services/rating.service";
import {IRatingCreate} from "../models/interfaces/rating.types";

@singleton()
export class PropertyController {
    propertyService: PropertyService;
    ratingService: RatingService;
    authMiddleware: AuthMiddleware;
    router: Router;

    constructor() {
        this.propertyService = container.resolve(PropertyService);
        this.ratingService = container.resolve(RatingService);
        this.authMiddleware = new AuthMiddleware();
        this.router = Router();
    }


    createProperty = async (req: AuthRequest, res: Response) => {
        try {
            const currAuthenticatedUserId = req.user?.id!;

            if (!currAuthenticatedUserId) {
                throw Unauthorized();
            }

            const propertyData: IPropertyCreate = req.body;
            const property = await this.propertyService.createProperty(propertyData);
            res.status(201).json(property);
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }
    };

    checkAvailabilityForPropertyStartAndEndDate = async (req: Request, res: Response) => {
        const propertyId = req.params.propertyId;
        const {checkIn, checkOut} = req.query;

        try {
            if (!checkIn || !checkOut) {
                throw BadRequest('Start and end date are required');
            }

            const isAvailable = await this.propertyService.verifyNoOverlappingBookings(propertyId, new Date(checkIn as string), new Date(checkOut as string));
            res.status(200).json(isAvailable);
        } catch (error: any) {
            res.status(error.status || 500).json(error);

        }
    }

    getPropertyById = async (req: Request, res: Response) => {
        const propertyId = req.params.id;
        try {
            const property = await this.propertyService.getPropertyById(propertyId);
            res.status(200).json(property);
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }
    }

    searchPropertiesByPropertyIds = async (req: Request, res: Response) => {
        const propertyIds = req.body
        try {
            const bookings = await this.propertyService.getPropertyByIds(propertyIds);
            res.status(200).json(bookings);
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }
    }


    updateProperty = async (req: AuthRequest, res: Response) => {
        const authenticatedUserId = req.user?.id;

        try {
            if (!authenticatedUserId) {
                console.error('Not authenticated');
                throw Unauthorized();
            }

            const propertyId = req.params.id;
            const propertyOriginal = await this.propertyService.getPropertyById(propertyId);

            if (!req.user?.roles.includes(UserRole.ADMIN) && propertyOriginal.owner.toString() !== authenticatedUserId) {
                console.error('Only the owner or an admin can update a property');
                throw Forbidden();
            }

            const propertyData = req.body;
            const property = await this.propertyService.updateProperty(propertyId, propertyData);
            res.status(200).json(property);
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }
    }

    getPropertiesForUser = async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.params.userId;
            const authenticatedUserId = req.user?.id;

            if (!authenticatedUserId) {
                console.error('Not authenticated');
                throw Unauthorized();
            }

            // Only allow users to get their own properties unless they are an admin
            if (!req.user?.roles.includes(UserRole.ADMIN) && userId !== authenticatedUserId) {
                throw Forbidden("Only admins can get properties for other users");
            }

            const properties = await this.propertyService.getPropertiesByUserId(authenticatedUserId);
            res.status(200).json(properties);
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }
    }



    getAllProperties = async (req: Request, res: Response) => {
        try {
            const properties = await this.propertyService.getAllProperties();
            console.log(`returning ${properties.length} properties with data ${properties}`);
            res.status(200).json(properties);
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }


    }


    makePropertyAvailable = async (req: Request, res: Response) => {

        try {
            const propertyId = req.params.id;
            const property = await this.propertyService.makePropertyAvailable(propertyId);

            res.status(200).json(property);

        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }
    }


    createRating = async (req: AuthRequest, res: Response) => {
        const currentAuthenticatedUserId = req.user?.id!;
        const ratingData: IRatingCreate = req.body;

        try {
            if (!ratingData) {
                throw BadRequest('No rating data provided');
            }

            if (currentAuthenticatedUserId !== ratingData?.userId) {
                throw Forbidden('You can only create a rating for yourself');
            }

            const ratingsWithLatestAdded = await this.ratingService.createRating(ratingData);
            res.status(201).json(ratingsWithLatestAdded);
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }
    }


    deleteRating = async (req: Request, res: Response) => {
        const ratingId = req.params.id;
        try {
            if (!ratingId) {
                throw BadRequest('Rating ID is required');
            }

            const latestRatingsRefreshed = await this.ratingService.deleteRating(ratingId);
            res.status(200).json(latestRatingsRefreshed);
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }
    }

    updateRating = async (req: Request, res: Response) => {

        const ratingId = req.params.id;
        const ratingData: Partial<Pick<IRatingCreate, 'rating' | 'review'>> = req.body;

        try {
            if (!ratingId) {
                throw BadRequest('Rating ID is required');
            }

            if (!ratingData) {
                throw BadRequest('Rating data is required');
            }

            const rating = await this.ratingService.updateRating(ratingId, ratingData);
            res.status(200).json(rating);
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }
    }

    toggleRatingHelpfulForUser = async (req: AuthRequest, res: Response) => {
        const ratingId = req.params.id;
        const currAuthenticatedUserId = req.user?.id!;

        try {
            if (!ratingId) {
                throw BadRequest('Rating ID is required');
            }

            const rating = await this.ratingService.toggleHelpful(ratingId, currAuthenticatedUserId);
            res.status(200).json(rating);
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }
    }

    getRatingsForProperty = async (req: Request, res: Response) => {
        const propertyId = req.params.propertyId;

        try {
            if (!propertyId) {
                throw BadRequest('Property ID is required');
            }

            const ratings = await this.ratingService.getPopulatedRatingsByPropertyId(propertyId);
            res.status(200).json(ratings);
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }
    }

    routes() {
        this.router.post('/', this.authMiddleware.authenticate, this.createProperty);
        this.router.put('/:id', this.authMiddleware.authenticate, this.updateProperty);
        this.router.get('/:id', this.getPropertyById);
        this.router.post('/searchByIds', this.searchPropertiesByPropertyIds);
        this.router.get('/checkAvailabilityForPropertyStartAndEndDate/:propertyId', this.checkAvailabilityForPropertyStartAndEndDate);
        this.router.get('/findByUser/:userId', this.authMiddleware.authenticate, this.getPropertiesForUser);
        this.router.get('/', this.getAllProperties);
        this.router.put('/:id/available', this.authMiddleware.authenticate, this.authMiddleware.requireRoles([UserRole.USER]), this.makePropertyAvailable);
        this.router.post('/ratings', this.authMiddleware.authenticate, this.createRating);
        this.router.put('/ratings/:id', this.authMiddleware.authenticate, this.updateRating);
        this.router.delete('/ratings/:id', this.authMiddleware.authenticate, this.deleteRating);
        this.router.put('/ratings/:id/helpful', this.authMiddleware.authenticate, this.toggleRatingHelpfulForUser);
        this.router.get('/:propertyId/ratings', this.getRatingsForProperty);
        return this.router;
    }
}
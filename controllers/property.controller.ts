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

    //swagger
    /**
     * @swagger
     * /properties:
     *   post:
     *     summary: Create a property
     *     description: Create a property
     *     tags: [Property]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/PropertyCreate'
     *     responses:
     *       201:
     *         description: Property created
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/PropertyResponse'
     */
    createProperty = async (req: Request, res: Response) => {
        try {
            const propertyData: IPropertyCreate = req.body;
            const property = await this.propertyService.createProperty(propertyData);
            res.status(201).json(property);
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }
    };

    //swagger
    /**
     * @swagger
     * /availableProperties:
     *   get:
     *     summary: Get all available properties or filter properties
     *     description: Get all properties or filter properties
     *     tags: [Property]
     *     parameters:
     *       - in: query
     *         name: availableOnly
     *         schema:
     *           type: boolean
     *         required: false
     *         description: Filter by availability
     *       - in: query
     *         name: name
     *         schema:
     *           type: string
     *         required: false
     *         description: Filter by name
     *       - in: query
     *         name: description
     *         schema:
     *           type: string
     *         required: false
     *         description: Filter by description
     *       - in: query
     *         name: price
     *         schema:
     *           type: number
     *         required: false
     *         description: Filter by price
     *       - in: query
     *         name: address
     *         schema:
     *           type: string
     *         required: false
     *         description: Filter by address
     *     responses:
     *       200:
     *         description: Properties returned
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/PropertyResponse'
     */
    getAvailableProperties = async (req: Request, res: Response) => {
        if (Object.keys(req.query).length === 0) {
            const properties = await this.propertyService.getAllAvailableProperties();
            res.status(200).json(properties);
        } else {
            const filterObject = req.query;
            const filters = new Map<string, string>(Object.entries(filterObject) as [string, string][]);
            const properties = await this.propertyService.getPropertiesWithFilter(filters);
            res.status(200).json(properties);
        }
    };


    /**
     * @swagger
     * /properties/{propertyId}/availability:
     *   get:
     *     summary: Check property availability for given dates
     *     description: Check if a property is available for the specified start and end dates
     *     tags: [Property]
     *     parameters:
     *       - in: path
     *         name: propertyId
     *         schema:
     *           type: string
     *         required: true
     *         description: Property ID
     *       - in: query
     *         name: startDate
     *         schema:
     *           type: string
     *           format: date
     *         required: true
     *         description: Start date
     *       - in: query
     *         name: endDate
     *         schema:
     *           type: string
     *           format: date
     *         required: true
     *         description: End date
     *     responses:
     *       200:
     *         description: Availability status
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 available:
     *                   type: boolean
     *       400:
     *         description: Start and end date are required
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       404:
     *         description: Property not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
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

    //swagger
    /**
     * @swagger
     * /properties/{id}:
     *   get:
     *     summary: Get a property by id
     *     description: Get a property by id
     *     tags: [Property]
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *         required: true
     *         description: Property id
     *     responses:
     *       200:
     *         description: Property found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/PropertyResponse'
     *       404:
     *         description: Property not found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    getPropertyById = async (req: Request, res: Response) => {
        const propertyId = req.params.id;
        try {
            const property = await this.propertyService.getPropertyById(propertyId);
            res.status(200).json(property);
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }

    }

    /**
     * @swagger
     * /properties/searchByIds:
     *   post:
     *     summary: Search properties by property IDs
     *     description: Search properties by providing an array of property IDs
     *     tags: [Property]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: array
     *             items:
     *               type: string
     *     responses:
     *       200:
     *         description: Properties found
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/PropertyResponse'
     *       500:
     *         description: Internal server error
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    searchPropertiesByPropertyIds = async (req: Request, res: Response) => {
        const propertyIds = req.body
        try {
            const bookings = await this.propertyService.getPropertyByIds(propertyIds);
            res.status(200).json(bookings);
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }
    }

    //swagger
    /**
     * @swagger
     * /properties/{id}:
     *   put:
     *     summary: Update a property
     *     description: Update a property
     *     tags: [Property]
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *         required: true
     *         description: Property id
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/PropertyUpdate'
     *     responses:
     *       200:
     *         description: Property updated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/PropertyResponse'
     *       404:
     *         description: Property not found
     *         content:
     *           application/json:
     *              schema:
     *              $ref: '#/components/schemas/ErrorResponse'
     */
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

    //swagger
    /**
     * @swagger
     * /properties/{id}:
     *   delete:
     *     summary: Delete a property
     *     description: Delete a property
     *     tags: [Property]
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *         required: true
     *         description: Property id
     *     responses:
     *       200:
     *         description: Property deleted
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/PropertyResponse'
     *       404:
     *         description: Property not found
     *         content:
     *           application/json:
     *              schema:
     *                $ref: '#/components/schemas/ErrorResponse'
     */
    deleteProperty = async (req: Request, res: Response) => {
        const propertyId = req.params.id;
        try {
            const property = await this.propertyService.deleteProperty(propertyId);
            res.status(200).json(property);
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }
    }

    //swagger
    /**
     * @swagger
     * /properties/findByUser:
     *   get:
     *     summary: Get properties for a user
     *     description: Get properties for a user
     *     tags: [Property]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Properties returned
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/PropertyResponse'
     *       401:
     *         description: Not authenticated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
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
                console.error('only the owner or an admin can get properties for a user');
                throw Forbidden();
            }

            const properties = await this.propertyService.getPropertiesByUserId(authenticatedUserId);
            res.status(200).json(properties);
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }

    }


    //swagger
    /**
     * @swagger
     * /properties:
     *   get:
     *     summary: Get all properties
     *     description: Get all properties
     *     tags: [Property]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Properties returned
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/PropertyResponse'
     *       401:
     *         description: Not authenticated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       403:
     *         description: Forbidden
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
    getAllProperties = async (req: Request, res: Response) => {
        try {
            const properties = await this.propertyService.getAllProperties();
            res.status(200).json(properties);
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }


    }

    //swagger
    /**
     * @swagger
     * /properties/{id}/available:
     *   put:
     *     summary: Make a property available
     *     description: Make a property available
     *     tags: [Property]
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *         required: true
     *         description: Property id
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Property updated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/PropertyResponse'
     *       401:
     *         description: Not authenticated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     *       403:
     *         description: Forbidden
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ErrorResponse'
     */
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

            if (currentAuthenticatedUserId !== ratingData?.user) {
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


    //router
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
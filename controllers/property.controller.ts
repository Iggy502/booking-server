//property.controller.ts
import {Request, Response, Router} from 'express';
import {container, singleton} from "tsyringe";
import {PropertyService} from "../services/property.service";
import {IPropertyCreate, UserRole} from '../models/interfaces';
import {AuthMiddleware} from "../middleware/auth/auth-middleware";
import {AuthRequest} from "../middleware/auth/types/token.type";

@singleton()
export class PropertyController {
    propertyService: PropertyService;
    authMiddleware: AuthMiddleware;
    router: Router;

    constructor() {
        this.propertyService = container.resolve(PropertyService);
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
        const propertyData: IPropertyCreate = req.body;
        const property = await this.propertyService.createProperty(propertyData);
        res.status(201).json(property);
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
            res.status(404).json({message: error.message});
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
    updateProperty = async (req: Request, res: Response) => {
        const userId = (<AuthRequest>req).user?.id;

        if (!userId) {
            res.status(401).json({message: 'Not authenticated'});
            return;
        }

        const propertyId = req.params.id;
        const propertyData = req.body;
        const property = await this.propertyService.updateProperty(propertyId, propertyData);
        res.status(200).json(property);
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
            res.status(error.status).json({
                message: error.message
            });
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
    getPropertiesForUser = async (req: Request, res: Response) => {

        const userId = (<AuthRequest>req).user?.id;

        if (!userId) {
            res.status(401).json({message: 'Not authenticated'});
            return;
        }

        const properties = await this.propertyService.getPropertiesByUserId(userId);
        res.status(200).json(properties);
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
        const properties = await this.propertyService.getAllProperties();
        res.status(200).json(properties);
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
        const propertyId = req.params.id;
        const property = await this.propertyService.makePropertyAvailable(propertyId);

        res.status(200).json(property);
    }

    //router
    routes() {
        this.router.post('/', this.createProperty);
        this.router.put('/:id', this.authMiddleware.authenticate, this.authMiddleware.requireRoles([UserRole.USER]), this.updateProperty);
        this.router.get('/', this.getAvailableProperties);
        this.router.get('/:id', this.getPropertyById);
        this.router.get('/findByUser', this.authMiddleware.authenticate, this.getPropertiesForUser);
        this.router.get('/properties', this.authMiddleware.authenticate, this.authMiddleware.requireRoles([UserRole.ADMIN]), this.getAllProperties);
        this.router.put('/:id/available', this.authMiddleware.authenticate, this.authMiddleware.requireRoles([UserRole.USER]), this.makePropertyAvailable);
        return this.router;
    }
}
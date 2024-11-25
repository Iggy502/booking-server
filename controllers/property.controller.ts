//property.controller.ts
import {Request, Response} from 'express';
import {autoInjectable, container, singleton} from "tsyringe";
import {PropertyService} from "../services/property.service";
import {IPropertyCreate, IPropertyResponse} from '../models/interfaces';
import {Router} from 'express';

@singleton()
export class PropertyController {
    propertyService: PropertyService;
    router: Router;

    constructor() {
        this.propertyService = container.resolve(PropertyService);
        this.router = Router();
    }

    //swagger
    /**
     * @swagger
     * /properties:
     *   post:
     *     summary: Create a property
     *     description: Create a property
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
        console.log("Handling GET /properties");
        const propertyData: IPropertyCreate = req.body;
        const property = await this.propertyService.createProperty(propertyData);
        res.status(201).json(property);
    };

    //swagger
    /**
     * @swagger
     * /properties:
     *   get:
     *     summary: Get all properties or filter properties
     *     description: Get all properties or filter properties
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
    getProperties = async (req: Request, res: Response) => {
        if (Object.keys(req.query).length === 0) {
            const properties = await this.propertyService.getAllProperties();
            res.status(200).json(properties);
        } else {
            let {availableOnly, ...filterObject} = req.query;
            const filters = new Map<string, string>(Object.entries(filterObject) as [string, string][]);
            console.log(filterObject);
            const availableOnlyBool = availableOnly === 'true';
            const properties = await this.propertyService.getPropertiesWithFilter(availableOnlyBool, filters);
            res.status(200).json(properties);
        }
    };

    //router
    routes() {
        this.router.post('/', this.createProperty);
        this.router.get('/', this.getProperties);
        return this.router;
    }
}
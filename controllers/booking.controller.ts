//Controller for booking
import {Request, Response, Router} from 'express';
import {BookingService} from '../services/booking.service';
import {IBookingCreate, IBookingUpdate} from '../models/interfaces';
import {container, singleton} from "tsyringe";
import {HttpError} from "../services/exceptions/http-error";
import {AuthMiddleware} from "../middleware/auth/auth-middleware";

@singleton()
export class BookingController {
    bookingService: BookingService;
    router: Router;
    authMiddleware: AuthMiddleware;

    constructor() {
        this.bookingService = container.resolve(BookingService);
        this.authMiddleware = new AuthMiddleware();
        this.router = Router();
    }

    //swagger
    /**
     * @swagger
     * /bookings:
     *   post:
     *     summary: Create a booking
     *     description: Create a booking
     *     tags: [Booking]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/BookingCreate'
     *     responses:
     *       201:
     *         description: Booking created
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/BookingResponse'
     *       400:
     *          description: Bad request
     *          content:
     *           application/json:
     *             schema:
     *             type: object
     *             properties:
     *               error:
     *               type: string
     *               example: Bad request
     *       404:
     *           description: Not found
     *           content:
     *           application/json:
     *             schema:
     *             type: object
     *             properties:
     *               error:
     *               type: string
     *               example: Not found
     */
    createBooking = async (req: Request, res: Response) => {
        try {
            if (!req.body.checkIn || !req.body.checkOut || !req.body.propertyId || !req.body.guestId) {
                throw new HttpError(400, 'Please provide checkIn, checkOut, propertyId and guestId');
            }

            const bookingData: IBookingCreate = {
                ...req.body,
                checkIn: new Date(req.body.checkIn),
                checkOut: new Date(req.body.checkOut)
            };

            const booking = await this.bookingService.createBooking(bookingData);
            res.status(201).json(booking);
        } catch (error: any) {
            if (error instanceof HttpError) {
                res.status(error.status).json({error: error.message});
            } else {
                res.status(500).json({error: 'Internal server error'});
            }
        }
    };

    //swagger documentation
    /**
     * @swagger
     * /bookings/{id}:
     *   get:
     *     summary: Get a booking by id
     *     description: Get a booking by id
     *     tags: [Booking]
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *         required: true
     *         description: Booking id
     *     responses:
     *       200:
     *         description: Booking found
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/BookingResponse'
     */
    getBookingById = async (req: Request, res: Response) => {
        const bookingId = req.params.id;

        try {
            const booking = await this.bookingService.getBookingById(bookingId);
            res.status(200).json(booking);
        } catch (error: any) {
            res.status(error.status).json({error: error.message});
        }
    };


    //swagger documentation
    /**
     * @swagger
     * /bookings:
     *   get:
     *     summary: Get bookings by user id
     *     description: Get bookings by user id
     *     tags: [Booking]
     *     parameters:
     *       - in: query
     *         name: userId
     *         schema:
     *           type: string
     *         required: true
     *         description: User id
     *     responses:
     *       200:
     *         description: Bookings found
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/BookingResponse'
     */
    getBookingsByUserId = async (req: Request, res: Response) => {
        const userId = req.query.userId as string;
        try {
            const bookings = await this.bookingService.getBookingsByUserId(userId);
            res.status(200).json(bookings);
        } catch (error: any) {
            res.status(error.status).json({error: error.message});
        }
    }

    //swagger documentation
    /**
     * @swagger
     * /bookings:
     *   get:
     *     summary: Get bookings within date range
     *     description: Get bookings within date range
     *     tags: [Booking]
     *     parameters:
     *       - in: query
     *         name: startDate
     *         schema:
     *           type: string
     *         required: true
     *         description: Start date
     *       - in: query
     *         name: endDate
     *         schema:
     *           type: string
     *         required: true
     *         description: End date
     *     responses:
     *        200:
     *           content:
     *            application/json:
     *               schema:
     *                $ref: '#/components/schemas/BookingResponseMultiple'
     */
    getBookingsWithinDateRange = async (req: Request, res: Response) => {

        if (!req.query.startDate || !req.query.endDate) {
            res.status(400).json({error: 'Please provide start date and end date'});
        }

        const startDate = new Date(req.query.startDate as string);
        const endDate = new Date(req.query.endDate as string);
        try {
            const bookings = await this.bookingService.getBookingsWithinDateRange(startDate, endDate);
            res.status(200).json(bookings);
        } catch (error: any) {
            res.status(error.status).json({error: error.message});
        }
    }


    //swagger documentation
    /**
     * @swagger
     * /bookings/{id}:
     *   put:
     *     summary: Update a booking
     *     description: Update a booking
     *     tags: [Booking]
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *         required: true
     *         description: Booking id,
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             $ref: '#/components/schemas/Booking'
     *     responses:
     *       200:
     *         description: Booking updated
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Booking'
     */
    updateBooking = async (req: Request, res: Response) => {
        const bookingId = req.params.id;
        const bookingData: IBookingUpdate = req.body;
        try {
            const booking = await this.bookingService.updateBooking(bookingId, bookingData);
            res.status(200).json(booking);
        } catch (error: any) {
            res.status(error.status).json({error: error.message});

        }
    };


    /**
     * @swagger
     * /bookings/property/{propertyId}:
     *   get:
     *     summary: Get bookings by property id
     *     description: Get all bookings for a specific property
     *     tags: [Booking]
     *     parameters:
     *       - in: path
     *         name: propertyId
     *         schema:
     *           type: string
     *         required: true
     *         description: Property id
     *     responses:
     *       200:
     *         description: Bookings found
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/BookingResponse'
     *       404:
     *         description: No bookings found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *                   example: No bookings found
     */
    getBookingsByPropertyId = async (req: Request, res: Response) => {
        const propertyId = req.params.propertyId;
        try {
            const bookings = await this.bookingService.getBookingsByPropertyId(propertyId);
            res.status(200).json(bookings);
        } catch (error: any) {
            res.status(error.status || 500).json({error: error.message});
        }
    };


    //swagger documentation
    /**
     * @swagger
     * /bookings/properties:
     *   post:
     *     summary: Get bookings by multiple property ids
     *     description: Get all bookings for multiple properties
     *     tags: [Booking]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               propertyIds:
     *                 type: array
     *                 items:
     *                   type: string
     *                 description: Array of property ids
     *     responses:
     *       200:
     *         description: Bookings found
     *         content:
     *           application/json:
     *             schema:
     *               type: array
     *               items:
     *                 $ref: '#/components/schemas/BookingResponse'
     *       404:
     *         description: One or more properties not found
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 error:
     *                   type: string
     *                   example: One or more properties not found
     */
    getBookingsByPropertyIds = async (req: Request, res: Response) => {
        const propertyIds = req.body.propertyIds as string[];
        try {
            const bookings = await this.bookingService.getBookingsByPropertyIds(propertyIds);
            res.status(200).json(bookings);
        } catch (error: any) {
            res.status(error.status || 500).json({error: error.message});
        }
    };


    //swagger documentation
    /**
     * @swagger
     * /bookings/{id}:
     *   delete:
     *     summary: Delete a booking
     *     tags: [Booking]
     *     description: Delete a booking
     *     parameters:
     *       - in: path
     *         name: id
     *         schema:
     *           type: string
     *         required: true
     *         description: Booking id
     *     responses:
     *       200:
     *         description: Booking deleted
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/Booking'
     */
    deleteBooking = async (req: Request, res: Response) => {
        const bookingId = req.params.id;

        try {
            const booking = await this.bookingService.deleteBooking(bookingId);
            res.status(200).json(booking);
        } catch (error: any) {
            res.status(error.status).json({error: error.message});
        }
    };

    routes() {
        this.router.post('/', this.authMiddleware.authenticate, this.createBooking);
        this.router.get('/:id', this.getBookingById);
        this.router.put('/:id', this.updateBooking);
        this.router.delete('/:id', this.deleteBooking);
        return this.router;
    }

}



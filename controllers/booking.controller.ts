//Controller for booking
import {Request, Response, Router} from 'express';
import {BookingService} from '../services/booking.service';
import {IBookingCreate, IBookingUpdate} from '../models/interfaces';
import {container, singleton} from "tsyringe";

@singleton()
export class BookingController {
    bookingService: BookingService;
    router: Router;

    constructor() {
        this.bookingService = container.resolve(BookingService);
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
        const bookingData: IBookingCreate = {
            ...req.body,
            checkIn: new Date(req.body.checkIn),
            checkOut: new Date(req.body.checkOut)
        };
        try {
            const booking = await this.bookingService.createBooking(bookingData);
            res.status(201).json(booking);
        } catch (error: any) {
            res.status(error.status || 500).json({error: error.message});
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
        this.router.post('/', this.createBooking);
        this.router.get('/:id', this.getBookingById);
        this.router.put('/:id', this.updateBooking);
        this.router.delete('/:id', this.deleteBooking);
        return this.router;
    }

}



//Controller for booking
import {Request, Response} from 'express';
import {BookingService} from '../services/booking.service';
import {IBookingCreate, IBookingResponse, IBookingUpdate} from '../models/interfaces';
import {Router} from 'express';
import {autoInjectable, container, singleton} from "tsyringe";

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
     */
    createBooking = async (req: Request, res: Response) => {
        const userId = req.query.userId as string;
        const bookingData: IBookingCreate = req.body;
        const booking = await this.bookingService.createBooking(userId, bookingData);
        res.status(201).json(booking);

    };

    //swagger documentation
    /**
     * @swagger
     * /bookings/{id}:
     *   get:
     *     summary: Get a booking by id
     *     description: Get a booking by id
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
     *               $ref: '#/components/schemas/Booking'
     */
    getBookingById = async (req: Request, res: Response) => {
        const bookingId = req.params.id;
        const booking = await this.bookingService.getBookingById(bookingId);
        res.json(booking);
    };

    //swagger documentation
    /**
     * @swagger
     * /bookings/{id}:
     *   put:
     *     summary: Update a booking
     *     description: Update a booking
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
        const booking = await this.bookingService.updateBooking(bookingId, bookingData);
        res.json(booking);
    };

    //swagger documentation
    /**
     * @swagger
     * /bookings/{id}:
     *   delete:
     *     summary: Delete a booking
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
        const booking = await this.bookingService.deleteBooking(bookingId);
        res.json(booking);
    };

    routes() {
        this.router.post('/', this.createBooking);
        this.router.get('/:id', this.getBookingById);
        this.router.put('/:id', this.updateBooking);
        this.router.delete('/:id', this.deleteBooking);
        return this.router;
    }

}



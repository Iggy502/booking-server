//Controller for booking
import {Request, Response} from 'express';
import {BookingService} from '../services/booking.service';
import {IBookingCreate, IBookingResponse, IBookingUpdate} from '../models/interfaces';
import {Router} from 'express';
import {autoInjectable} from "tsyringe";

@autoInjectable()
export class BookingController {
    bookingService: BookingService;
    router: Router;

    constructor(bookingService: BookingService) {
        this.bookingService = bookingService;
        this.router = Router();
    }

    async createBooking(req: Request, res: Response) {
        const userId = req.query.userId as string;
        const bookingData: IBookingCreate = req.body;
        const booking = await this.bookingService.createBooking(userId, bookingData);
        res.status(201).json(booking);
    }

    async getBookingById(req: Request, res: Response) {
        const bookingId = req.params.id;
        const booking = await this.bookingService.getBookingById(bookingId);
        res.json(booking);
    }

    async updateBooking(req: Request, res: Response) {
        const bookingId = req.params.id;
        const bookingData: IBookingUpdate = req.body;
        const booking = await this.bookingService.updateBooking(bookingId, bookingData);
        res.json(booking);
    }

    async deleteBooking(req: Request, res: Response) {
        const bookingId = req.params.id;
        const booking = await this.bookingService.deleteBooking(bookingId);
        res.json(booking);
    }

    routes() {
        this.router.post('/', this.createBooking);
        this.router.get('/:id', this.getBookingById);
        this.router.put('/:id', this.updateBooking);
        this.router.delete('/:id', this.deleteBooking);
        return this.router;
    }

}



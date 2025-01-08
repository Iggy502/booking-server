//Controller for booking
import {Request, Response, Router} from 'express';
import {BookingService} from '../services/booking.service';
import {IBookingCreate} from '../models/interfaces';
import {container, singleton} from "tsyringe";
import {AuthMiddleware} from "../middleware/auth/auth-middleware";
import createHttpError, {BadRequest} from "http-errors";
import {AuthRequest} from "../middleware/auth/types/token.type";

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


    createBooking = async (req: AuthRequest, res: Response) => {
        try {
            const currentUser = req.user?.id!;

            if (!req.body.checkIn || !req.body.checkOut || !req.body.property) {
                throw BadRequest('Please provide checkIn, checkOut, propertyId');
            }

            const bookingData: IBookingCreate = {
                ...req.body,
                guest: currentUser,
                checkIn: new Date(req.body.checkIn),
                checkOut: new Date(req.body.checkOut)
            };

            const booking = await this.bookingService.createBooking(bookingData);
            res.status(201).json(booking);
        } catch (error: any) {
            res.status(error.status || 500).json(error);

        }
    };

    getBookingById = async (req: Request, res: Response) => {
        const bookingId = req.params.id;

        try {
            const booking = await this.bookingService.getBookingById(bookingId);
            res.status(200).json(booking);
        } catch (error: any) {
            res.status(error.status).json({error: error.message});
        }
    };

    searchBookingsByPropertyIds = async (req: Request, res: Response) => {
        const propertyIds = req.body
        try {
            const bookings = await this.bookingService.getBookingsByPropertyIds(propertyIds);
            res.status(200).json(bookings);
        } catch (error: any) {
            const status = error.status || 500;
            res.status(status).json(createHttpError(status, error.message));
        }
    }

    getBookingsByUserGuestId = async (req: Request, res: Response) => {
        const userId = req.params.userId as string;
        try {
            const bookings = await this.bookingService.getBookingsByUserGuestId(userId);
            res.status(200).json(bookings);
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }
    }

    getBookingsByUserGuestOrHostId = async (req: Request, res: Response) => {
        const userId = req.params.userId as string;
        try {
            const bookings = await this.bookingService.getBookingsByUserGuestOrHostId(userId);
            res.status(200).json(bookings);
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }
    }

    markConversationAsRead = async (req: AuthRequest, res: Response) => {
        try {
            const conversationId = req.params.conversationId;
            const userId = req.user?.id!;

            await this.bookingService.markConversationAsRead(conversationId, userId);
            res.status(200).json({message: 'Conversation marked as read'});
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }
    }

    getBookingsByPropertyId = async (req: Request, res: Response) => {
        const propertyId = req.params.propertyId;
        try {
            const bookings = await this.bookingService.getBookingsByPropertyId(propertyId);
            res.status(200).json(bookings);
        } catch (error: any) {
            res.status(error.status || 500).json(error);
        }
    };


    routes() {
        this.router.post('/', this.authMiddleware.authenticate, this.createBooking);
        this.router.get('/user/guest/:userId', this.getBookingsByUserGuestId);
        this.router.get('/findByUserGuestOrHost/:userId', this.getBookingsByUserGuestOrHostId);
        this.router.get('/findByProperty/:propertyId', this.getBookingsByPropertyId);
        this.router.post('/search', this.searchBookingsByPropertyIds);
        this.router.get('/:id', this.getBookingById);
        this.router.put('/conversation/:conversationId/read', this.authMiddleware.authenticate, this.markConversationAsRead);
        return this.router;
    }
}



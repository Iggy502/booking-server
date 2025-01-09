import 'reflect-metadata';
import express from 'express';
import {json} from 'body-parser';
import {container} from 'tsyringe';
import swaggerUi from 'swagger-ui-express';
import mongoose from 'mongoose';
import {UserController} from '../controllers/user.controller';
import {BookingController} from '../controllers/booking.controller';
import {PropertyController} from '../controllers/property.controller';
import {AuthController} from '../controllers/auth-controller';
import {ImageController} from '../controllers/image.controller';
import {swaggerDocs} from '../config/swagger.config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(json());
app.use(cookieParser());

app.use(
    cors({
        origin: ['http://localhost:5173', 'http://localhost:3001'],
        credentials: true
    })
);

// Define routes
const userController = container.resolve(UserController);
app.use('/users', userController.routes());

const bookingController = container.resolve(BookingController);
app.use('/bookings', bookingController.routes());

const propertyController = container.resolve(PropertyController);
app.use('/properties', propertyController.routes());

const authController = container.resolve(AuthController);
app.use(process.env.AUTH_BASE_URL || '/auth', authController.routes());

const imageUploadController = container.resolve(ImageController);
app.use('/images', imageUploadController.routes());

app.get('/', (req, res) => {
    res.send('Hello World!');
});

//swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


const PORT = process.env.PORT || 3000;

app.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);

    try {
        await mongoose.connect(`mongodb://${process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}@localhost:${process.env.MONGO_PORT}/${process.env.MONGO_INITDB_DATABASE}?authSource=admin`);

        console.log('Connected to database');
        console.log('Visit mongo express at http://localhost:8081');
    } catch (error) {
        console.error('Error connecting to database:', error);
    }
    console.log(`Swagger documentation is available at http://localhost:${PORT}/api-docs`);
});

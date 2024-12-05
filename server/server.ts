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

export const createServer = () => {
    const app = express();
    app.use(json());

    // Define routes
    const userController = container.resolve(UserController);
    app.use('/users', userController.routes());

    const bookingController = container.resolve(BookingController);
    app.use('/bookings', bookingController.routes());

    const propertyController = container.resolve(PropertyController);
    app.use('/properties', propertyController.routes());

    const authController = container.resolve(AuthController);
    app.use('/auth', authController.routes());

    const imageUploadController = container.resolve(ImageController);
    app.use('/images', imageUploadController.routes());

    app.get('/', (req, res) => {
        res.send('Hello World!');
    });

    //swagger documentation
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

    return app;
};

const PORT = 3000;
const app = createServer();
app.listen(PORT, async () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    try {
        await mongoose.connect('mongodb://admin:test@localhost:27017/booking_db?authSource=admin');
        console.log('Connected to database');
        console.log('Visit mongo express at http://localhost:8081');
    } catch (error) {
        console.error('Error connecting to database:', error);
    }
    console.log(`Swagger documentation is available at http://localhost:${PORT}/api-docs`);
});

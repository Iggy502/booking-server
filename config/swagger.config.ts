import swaggerJsdoc from 'swagger-jsdoc';
import {bookingPaths, bookingSchemas} from "./booking.schemas";
import {propertyPaths, propertySchemas} from "./property.schema";
import {userPaths, userSchemas} from "./user.schemas";
import {authPaths, authSchemas} from "./auth.schemas";


const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Booking API',
            version: '1.0.0',
            description: 'API documentation for the Booking application',
        },
        servers: [
            {
                url: 'http://localhost:3000',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token in the format: Bearer <token>'
                }
            },
            schemas: {
                ...bookingSchemas,
                ...propertySchemas,
                ...userSchemas,
                ...authSchemas
            }
        },
        paths: {
            ...bookingPaths,
            ...propertyPaths,
            ...userPaths,
            ...authPaths
        }
    },
    apis: ['./controllers/*.ts']
};

export const swaggerDocs = swaggerJsdoc(swaggerOptions);


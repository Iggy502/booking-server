import swaggerJsdoc from 'swagger-jsdoc';
import {faker} from '@faker-js/faker';
import mongoose from "mongoose";
import {UserRole} from "../models/interfaces";
import {AmenityType} from "../models/interfaces/amenity.type";
import {bookingPaths, bookingSchemas} from "./booking.schemas";


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
                ...bookingSchemas
            }
        },
        paths: {
            ...bookingPaths
        }
    },
    apis: ['./controllers/*.ts']
};

export const swaggerDocs = swaggerJsdoc(swaggerOptions);


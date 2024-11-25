import swaggerJsdoc from 'swagger-jsdoc';
import {faker} from '@faker-js/faker';
import mongoose from "mongoose";


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
            schemas: {
                UserCreate: {
                    type: 'object',
                    properties: {
                        email: {
                            type: 'string',
                            example: faker.internet.email(),
                        },
                        firstName: {
                            type: 'string',
                            example: faker.person.firstName(),
                        },
                        lastName: {
                            type: 'string',
                            example: faker.person.lastName(),
                        },
                        phone: {
                            type: 'string',
                            example: faker.phone.number()
                        },
                        password: {
                            type: 'string',
                            example: faker.internet.password()
                        }
                    }
                },
                UserResponse: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: new mongoose.Types.ObjectId()
                        },
                        phone: {
                            type: 'string',
                            example: faker.phone.number()
                        },
                        email: {
                            type: 'string',
                            example: faker.internet.email(),
                        },
                        firstName: {
                            type: 'string',
                            example: faker.person.firstName(),
                        },
                        lastName: {
                            type: 'string',
                            example: faker.person.lastName(),
                        }
                    }

                },
                UserDeleteResponse: {
                    allOf: [
                        {
                            $ref: '#/components/schemas/UserResponse'
                        },

                    ]
                },
                BookingCreate: {
                    type: 'object',
                    properties: {
                        property: {
                            type: 'string',
                            example: new mongoose.Types.ObjectId()
                        },
                        guest: {
                            type: 'string',
                            example: new mongoose.Types.ObjectId()
                        },
                        checkIn: {
                            type: 'string',
                            example: faker.date.recent().toISOString()
                        },
                        checkOut: {
                            type: 'string',
                            example: faker.date.future().toISOString()
                        },
                    }

                },
                BookingResponse: {
                    allOf: [
                        {
                            $ref: '#/components/schemas/BookingCreate'
                        },
                        {
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'string',
                                    example: new mongoose.Types.ObjectId()
                                }
                            }
                        }
                    ]
                },
                PropertyCreate: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            example: `Jerre's Paradise`
                        },
                        address: {
                            type: 'object',
                            properties: {
                                street: {
                                    type: 'string',
                                    example: faker.location.street()
                                },
                                city: {
                                    type: 'string',
                                    example: faker.location.city()
                                },
                                country: {
                                    type: 'string',
                                    example: faker.location.country()
                                },
                                postalCode: {
                                    type: 'string',
                                    example: faker.location.zipCode()
                                }
                            }
                        },
                        description: {
                            type: 'string',
                            example: faker.lorem.paragraph()
                        },
                        pricePerNight: {
                            type: 'number',
                            example: faker.finance.amount({min: 100, max: 1000})
                        },
                        maxGuests: {
                            type: 'number',
                            example: faker.finance.amount({min: 1, max: 10})
                        }
                    }
                },
                PropertyResponse: {
                    allOf: [
                        {
                            $ref: '#/components/schemas/PropertyCreate'
                        },
                        {
                            type: 'object',
                            properties: {
                                id: {
                                    type: 'string',
                                    example: new mongoose.Types.ObjectId()
                                }
                            }
                        }
                    ]
                }


            }
        }
    },
    apis: ['./controllers/*.ts', './models/*.ts'],
};

export const swaggerDocs = swaggerJsdoc(swaggerOptions);


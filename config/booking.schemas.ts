// src/docs/booking.docs.ts

export const bookingSchemas = {
    BookingBase: {
        type: 'object',
        properties: {
            property: {
                type: 'string',
                description: 'Property ID',
                example: '6507ebbd7c2e8c9c9c9c9c9c'
            },
            guest: {
                type: 'string',
                description: 'Guest User ID',
                example: '6507ebbd7c2e8c9c9c9c9c9d'
            },
            checkIn: {
                type: 'string',
                format: 'date',
                description: 'Check-in date',
                example: '2024-02-01'
            },
            checkOut: {
                type: 'string',
                format: 'date',
                description: 'Check-out date',
                example: '2024-02-05'
            },
            totalPrice: {
                type: 'number',
                description: 'Total price for the booking',
                example: 500.00
            },
            status: {
                type: 'string',
                enum: ['pending', 'confirmed', 'cancelled'],
                description: 'Booking status',
                example: 'pending'
            },
            numberOfGuests: {
                type: 'number',
                description: 'Number of guests',
                example: 2
            },
            conversation: {
                type: 'object',
                properties: {
                    messages: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                from: {
                                    type: 'string',
                                    example: '6507ebbd7c2e8c9c9c9c9c9e'
                                },
                                to: {
                                    type: 'string',
                                    example: '6507ebbd7c2e8c9c9c9c9c9f'
                                },
                                content: {
                                    type: 'string',
                                    example: 'Hello, I have a question about the booking.'
                                },
                                read: {
                                    type: 'boolean',
                                    example: false
                                }
                            }
                        }
                    },
                    active: {
                        type: 'boolean',
                        example: true
                    }
                }
            }
        }
    },
    PopulatedBookingResponse: {
        type: 'object',
        properties: {
            id: {
                type: 'string',
                example: '6507ebbd7c2e8c9c9c9c9c9c'
            },
            property: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        example: 'Luxury Villa'
                    },
                    owner: {
                        type: 'object',
                        properties: {
                            firstName: {
                                type: 'string',
                                example: 'John'
                            },
                            lastName: {
                                type: 'string',
                                example: 'Doe'
                            },
                            profilePicturePath: {
                                type: 'string',
                                example: '/profiles/john-doe.jpg'
                            }
                        }
                    }
                }
            },
            guest: {
                type: 'object',
                properties: {
                    firstName: {
                        type: 'string',
                        example: 'Jane'
                    },
                    lastName: {
                        type: 'string',
                        example: 'Smith'
                    },
                    profilePicturePath: {
                        type: 'string',
                        example: '/profiles/jane-smith.jpg'
                    }
                }
            }
        }
    }
};

export const bookingPaths = {
    '/bookings': {
        post: {
            summary: 'Create a new booking',
            tags: ['Bookings'],
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['property', 'guest', 'checkIn', 'checkOut', 'numberOfGuests'],
                            properties: {
                                property: {
                                    type: 'string',
                                    example: '6507ebbd7c2e8c9c9c9c9c9c'
                                },
                                guest: {
                                    type: 'string',
                                    example: '6507ebbd7cr28c9c9g7c9c9d'
                                },
                                checkIn: {
                                    type: 'string',
                                    format: 'date',
                                    example: '2024-02-01'
                                },
                                checkOut: {
                                    type: 'string',
                                    format: 'date',
                                    example: '2024-02-05'
                                },
                                numberOfGuests: {
                                    type: 'number',
                                    example: 2
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                201: {
                    description: 'Booking created successfully',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    { $ref: '#/components/schemas/BookingBase' },
                                    {
                                        type: 'object',
                                        properties: {
                                            id: {
                                                type: 'string',
                                                example: '6507ebbd7c2e8c9c9c9c9c9c'
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                400: {
                    description: 'Bad Request',
                    content: {
                        'application/json': {
                            examples: {
                                missingFields: {
                                    value: { error: 'Please provide checkIn, checkOut, propertyId' }
                                },
                                invalidDates: {
                                    value: { error: 'Check out date should be after check in date' }
                                },
                                overlapBooking: {
                                    value: { error: 'Booking overlaps with existing booking' }
                                },
                                guestLimit: {
                                    value: { error: 'Number of guests exceeds property limit' }
                                }
                            }
                        }
                    }
                },
                404: {
                    description: 'Not Found',
                    content: {
                        'application/json': {
                            examples: {
                                propertyNotFound: {
                                    value: { error: 'Property not found or not available' }
                                },
                                guestNotFound: {
                                    value: { error: 'Guest not found' }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/bookings/{id}': {
        get: {
            summary: 'Get a booking by ID',
            tags: ['Bookings'],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    required: true,
                    schema: { type: 'string' },
                    description: 'Booking ID'
                }
            ],
            responses: {
                200: {
                    description: 'Booking details retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/BookingBase'
                            }
                        }
                    }
                },
                404: {
                    description: 'Booking not found',
                    content: {
                        'application/json': {
                            example: {
                                error: 'Booking not found'
                            }
                        }
                    }
                }
            }
        }
    },
    '/bookings/user/guest/{userId}': {
        get: {
            summary: 'Get all bookings for a guest user',
            tags: ['Bookings'],
            parameters: [
                {
                    in: 'path',
                    name: 'userId',
                    required: true,
                    schema: { type: 'string' },
                    description: 'User ID'
                }
            ],
            responses: {
                200: {
                    description: 'List of bookings retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    $ref: '#/components/schemas/BookingBase'
                                }
                            }
                        }
                    }
                },
                500: {
                    description: 'Internal Server Error',
                    content: {
                        'application/json': {
                            example: {
                                error: 'Internal Server Error'
                            }
                        }
                    }
                }
            }
        }
    },
    '/bookings/findByUserGuestOrHost/{userId}': {
        get: {
            summary: 'Get all bookings where user is either guest or host',
            tags: ['Bookings'],
            parameters: [
                {
                    in: 'path',
                    name: 'userId',
                    required: true,
                    schema: { type: 'string' },
                    description: 'User ID'
                }
            ],
            responses: {
                200: {
                    description: 'List of bookings retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    $ref: '#/components/schemas/PopulatedBookingResponse'
                                }
                            }
                        }
                    }
                },
                500: {
                    description: 'Internal Server Error',
                    content: {
                        'application/json': {
                            example: {
                                error: 'Internal Server Error'
                            }
                        }
                    }
                }
            }
        }
    },
    '/bookings/findByProperty/{propertyId}': {
        get: {
            summary: 'Get all bookings for a property',
            tags: ['Bookings'],
            parameters: [
                {
                    in: 'path',
                    name: 'propertyId',
                    required: true,
                    schema: { type: 'string' },
                    description: 'Property ID'
                }
            ],
            responses: {
                200: {
                    description: 'List of bookings retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    $ref: '#/components/schemas/BookingBase'
                                }
                            }
                        }
                    }
                },
                500: {
                    description: 'Internal Server Error',
                    content: {
                        'application/json': {
                            example: {
                                error: 'Internal Server Error'
                            }
                        }
                    }
                }
            }
        }
    },
    '/bookings/search': {
        post: {
            summary: 'Search bookings by property IDs',
            tags: ['Bookings'],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'array',
                            items: {
                                type: 'string'
                            }
                        },
                        example: [
                            '6507ebbd7c2e8c9c9c9c9c9c',
                            '6507ebbd7c2e8c9c9c9c9c9d'
                        ]
                    }
                }
            },
            responses: {
                200: {
                    description: 'List of bookings retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    $ref: '#/components/schemas/BookingBase'
                                }
                            }
                        }
                    }
                },
                500: {
                    description: 'Internal Server Error',
                    content: {
                        'application/json': {
                            example: {
                                error: 'Internal Server Error'
                            }
                        }
                    }
                }
            }
        }
    },
    '/bookings/conversation/{conversationId}/read': {
        put: {
            summary: 'Mark conversation as read',
            tags: ['Bookings'],
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'conversationId',
                    required: true,
                    schema: { type: 'string' },
                    description: 'Conversation ID'
                }
            ],
            responses: {
                200: {
                    description: 'Conversation marked as read',
                    content: {
                        'application/json': {
                            example: {
                                message: 'Conversation marked as read'
                            }
                        }
                    }
                },
                403: {
                    description: 'Forbidden',
                    content: {
                        'application/json': {
                            example: {
                                error: 'You do not have permission to update the conversation status'
                            }
                        }
                    }
                },
                404: {
                    description: 'Not Found',
                    content: {
                        'application/json': {
                            examples: {
                                bookingNotFound: {
                                    value: {
                                        error: 'Booking not found for conversation'
                                    }
                                },
                                propertyNotFound: {
                                    value: {
                                        error: 'Property not found for booking linked to this conversation'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};
// src/docs/property.docs.ts

import {AmenityType} from "../models/interfaces/amenity.type";

export const propertySchemas = {
    PropertyBase: {
        type: 'object',
        required: ['name', 'description', 'address', 'pricePerNight', 'maxGuests'],
        properties: {
            name: {
                type: 'string',
                description: 'Property name'
            },
            owner: {
                type: 'string',
                description: 'Property owner ID (ObjectId)'
            },
            description: {
                type: 'string',
                description: 'Property description'
            },
            available: {
                type: 'boolean',
                description: 'Property availability status',
                default: false
            },
            address: {
                type: 'object',
                required: ['street', 'city', 'country', 'postalCode'],
                properties: {
                    street: {type: 'string'},
                    city: {type: 'string'},
                    country: {type: 'string'},
                    postalCode: {type: 'string'},
                    longitude: {type: 'number'},
                    latitude: {type: 'number'}
                }
            },
            pricePerNight: {
                type: 'number',
                minimum: 0,
                description: 'Price per night'
            },
            avgRating: {
                type: 'number',
                description: 'Average rating of the property',
                default: 0
            },
            totalRatings: {
                type: 'number',
                description: 'Total number of ratings',
                default: 0
            },
            maxGuests: {
                type: 'number',
                minimum: 1,
                description: 'Maximum number of guests'
            },
            imagePaths: {
                type: 'array',
                items: {
                    type: 'string',
                    example: 'path/to/image.jpg'
                },
                description: 'Array of image paths (string URI)',
                default: []
            },
            amenities: {
                type: 'array',
                items: {
                    type: 'object',
                    required: ['type'],
                    properties: {
                        type: {
                            type: 'string',
                            enum: [...Object.values(AmenityType)],
                        },
                        description: {type: 'string'},
                        amount: {type: 'number'}
                    }
                },
                description: 'Available amenities'
            }
        }
    },
    Rating: {
        type: 'object',
        required: ['property', 'user', 'rating', 'review'],
        properties: {
            property: {
                type: 'string',
                description: 'Property ID (ObjectId)'
            },
            user: {
                type: 'string',
                description: 'User ID who created the rating (ObjectId)'
            },
            rating: {
                type: 'number',
                minimum: 1,
                maximum: 5,
                description: 'Rating value (1-5)'
            },
            review: {
                type: 'string',
                minLength: 10,
                maxLength: 1000,
                description: 'Written review'
            },
            helpful: {
                type: 'array',
                items: {
                    type: 'string'
                },
                description: 'Array of user IDs who found this review helpful'
            },
            createdAt: {
                type: 'string',
                format: 'date-time',
                description: 'Rating creation timestamp'
            },
            updatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Rating update timestamp'
            }
        }
    },
    RatingResponsePopulated: {
        type: 'object',
        properties: {
            id: {type: 'string'},
            rating: {type: 'number'},
            review: {type: 'string'},
            helpful: {type: 'number'},
            createdAt: {type: 'string', format: 'date-time'},
            updatedAt: {type: 'string', format: 'date-time'},
            property: {
                type: 'object',
                properties: {
                    id: {type: 'string'},
                    name: {type: 'string'},
                    avgRating: {type: 'number'},
                    totalRatings: {type: 'number'}
                }
            },
            user: {
                type: 'object',
                properties: {
                    id: {type: 'string'},
                    firstName: {type: 'string'},
                    lastName: {type: 'string'},
                    profilePicturePath: {type: 'string'}
                }
            }
        }
    }
};

export const propertyPaths = {
    '/properties': {
        post: {
            summary: 'Create a new property',
            tags: ['Properties'],
            security: [{bearerAuth: []}],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/PropertyBase'
                        }
                    }
                }
            },
            responses: {
                201: {
                    description: 'Property created successfully',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    {$ref: '#/components/schemas/PropertyBase'},
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
                404: {
                    description: 'Not Found',
                    content: {
                        'application/json': {
                            example: {
                                error: 'No User found for given ownerId'
                            }
                        }
                    }
                },
                401: {
                    description: 'Unauthorized',
                    content: {
                        'application/json': {
                            example: {
                                error: 'Authentication required'
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
        },
        get: {
            summary: 'Get all properties made available by owners',
            tags: ['Properties'],
            parameters: [],
            responses: {
                200: {
                    description: 'List of properties retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    allOf: [
                                        {$ref: '#/components/schemas/PropertyBase'},
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
                    }
                },
                500: {
                    description: 'Internal Server Error'
                }
            }
        }
    },
    '/properties/{id}': {
        get: {
            summary: 'Get a property by ID',
            tags: ['Properties'],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    required: true,
                    schema: {type: 'string'},
                    description: 'Property ID'
                }
            ],
            responses: {
                200: {
                    description: 'Property details retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    {$ref: '#/components/schemas/PropertyBase'},
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
                404: {
                    description: 'Property not found',
                    content: {
                        'application/json': {
                            example: {
                                error: 'Property not found'
                            }
                        }
                    }
                }
            }
        },
        put: {
            summary: 'Update a property',
            tags: ['Properties'],
            security: [{bearerAuth: []}],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    required: true,
                    schema: {type: 'string'},
                    description: 'Property ID'
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/PropertyBase'
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Property updated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    {$ref: '#/components/schemas/PropertyBase'},
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
                401: {
                    description: 'Unauthorized',
                    content: {
                        'application/json': {
                            example: {
                                error: 'Not authenticated'
                            }
                        }
                    }
                },
                403: {
                    description: 'Forbidden',
                    content: {
                        'application/json': {
                            example: {
                                error: 'Only the owner or an admin can update a property'
                            }
                        }
                    }
                },
                404: {
                    description: 'Property not found',
                    content: {
                        'application/json': {
                            example: {
                                error: 'Property not found'
                            }
                        }
                    }
                }
            }
        }
    },
    '/properties/searchByIds': {
        post: {
            summary: 'Search properties by IDs',
            tags: ['Properties'],
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
                        example: ['6507ebbd7c2e8c9c9c9c9c9c', '6507ebbd7c2e8c9c9c9c9c9d']
                    }
                }
            },
            responses: {
                200: {
                    description: 'Properties retrieved successfully. Will also return 200 with empty array if no properties are found',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    allOf: [
                                        {$ref: '#/components/schemas/PropertyBase'},
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
                    }
                },
                500: {
                    description: 'Internal Server Error',
                    content: {
                        'application/json': {
                            example: {
                                error: 'Something went wrong'
                            }
                        }
                    }
                }
            }
        }
    },
    '/properties/checkAvailabilityForPropertyStartAndEndDate/{propertyId}': {
        get: {
            summary: 'Check property availability for dates',
            tags: ['Properties'],
            parameters: [
                {
                    in: 'path',
                    name: 'propertyId',
                    required: true,
                    schema: {type: 'string'},
                    description: 'Property ID'
                },
                {
                    in: 'query',
                    name: 'checkIn',
                    required: true,
                    schema: {
                        type: 'string',
                        format: 'date'
                    },
                    description: 'Check-in date'
                },
                {
                    in: 'query',
                    name: 'checkOut',
                    required: true,
                    schema: {
                        type: 'string',
                        format: 'date'
                    },
                    description: 'Check-out date'
                }
            ],
            responses: {
                200: {
                    description: 'Availability status',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'boolean'
                            },
                            example: true
                        }
                    }
                },
                400: {
                    description: 'Bad Request',
                    content: {
                        'application/json': {
                            examples: {
                                missingDates: {
                                    value: {
                                        error: 'Start and end date are required'
                                    }
                                },
                                invalidDates: {
                                    value: {
                                        error: 'Check-out date must be after check-in date'
                                    }
                                }
                            }
                        }
                    }
                },
                404: {
                    description: 'Property not found',
                    content: {
                        'application/json': {
                            example: {
                                error: 'Property not found'
                            }
                        }
                    }
                }
            }
        }
    },
    '/properties/findByUser/{userId}': {
        get: {
            summary: 'Get properties for a user',
            tags: ['Properties'],
            security: [{bearerAuth: []}],
            parameters: [
                {
                    in: 'path',
                    name: 'userId',
                    required: true,
                    schema: {type: 'string'},
                    description: 'User ID'
                }
            ],
            responses: {
                200: {
                    description: 'List of properties retrieved successfully. Will also return 200 with empty array if no properties are found',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    allOf: [
                                        {$ref: '#/components/schemas/PropertyBase'},
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
                    }
                },
                500: {
                    description: 'Internal Server Error',
                    content: {
                        'application/json': {
                            example: {
                                error: 'Something went wrong.'
                            }
                        }
                    }
                }
            }
        }
    },
    '/properties/{id}/available': {
        put: {
            summary: 'Make property available',
            tags: ['Properties'],
            security: [{bearerAuth: []}],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    required: true,
                    schema: {type: 'string'},
                    description: 'Property ID'
                }
            ],
            responses: {
                200: {
                    description: 'Property availability status updated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    {$ref: '#/components/schemas/PropertyBase'},
                                    {
                                        type: 'object',
                                        properties: {
                                            id: {
                                                type: 'string',
                                                example: '6507ebbd7c2e8c9c9c9c9c9c'
                                            }
                                        }
                                    },
                                    {
                                        properties: {
                                            available: {
                                                type: 'boolean',
                                                example: true
                                            }
                                        }
                                    }
                                ]
                            }
                        }
                    }
                },
                401: {
                    description: 'Unauthorized',
                    content: {
                        'application/json': {
                            example: {
                                error: 'Authentication required'
                            }
                        }
                    }
                },
                403: {
                    description: 'Forbidden',
                    content: {
                        'application/json': {
                            example: {
                                error: 'Only a user with appropriate roles can update property availability'
                            }
                        }
                    }
                },
                404: {
                    description: 'Property not found',
                    content: {
                        'application/json': {
                            example: {
                                error: 'Property not found'
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
    }, '/properties/ratings': {
        post: {
            summary: 'Create a new rating',
            tags: ['Property Ratings'],
            security: [{bearerAuth: []}],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['propertyId', 'userId', 'rating', 'review'],
                            properties: {
                                propertyId: {type: 'string'},
                                userId: {type: 'string'},
                                rating: {type: 'number', minimum: 1, maximum: 5},
                                review: {type: 'string', minLength: 10, maxLength: 1000}
                            }
                        }
                    }
                }
            },
            responses: {
                201: {
                    description: 'Rating created successfully. Returns updated list of ratings for the property',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    $ref: '#/components/schemas/RatingResponsePopulated'
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Bad Request',
                    content: {
                        'application/json': {
                            example: {
                                error: 'No rating data provided'
                            }
                        }
                    }
                },
                403: {
                    description: 'Forbidden',
                    content: {
                        'application/json': {
                            example: {
                                error: 'You can only create a rating for yourself'
                            }
                        }
                    }
                }
            }
        }
    },
    '/properties/ratings/{id}': {
        put: {
            summary: 'Update a rating',
            tags: ['Property Ratings'],
            security: [{bearerAuth: []}],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    required: true,
                    schema: {type: 'string'},
                    description: 'Rating ID'
                }
            ],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                rating: {type: 'number', minimum: 1, maximum: 5},
                                review: {type: 'string', minLength: 10, maxLength: 1000}
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Rating updated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/RatingResponsePopulated'
                            }
                        }
                    }
                },
                400: {
                    description: 'Bad Request',
                    content: {
                        'application/json': {
                            examples: {
                                noId: {
                                    value: {
                                        error: 'Rating ID is required'
                                    }
                                },
                                noData: {
                                    value: {
                                        error: 'Rating data is required'
                                    }
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
                                ratingNotFound: {
                                    value: {
                                        error: 'Rating not found'
                                    }
                                },
                                propertyNotFound: {
                                    value: {
                                        error: 'Property not found'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        delete: {
            summary: 'Delete a rating',
            tags: ['Property Ratings'],
            security: [{bearerAuth: []}],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    required: true,
                    schema: {type: 'string'},
                    description: 'Rating ID'
                }
            ],
            responses: {
                200: {
                    description: 'Rating deleted successfully. Returns updated list of ratings for the property',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    $ref: '#/components/schemas/RatingResponsePopulated'
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Bad Request',
                    content: {
                        'application/json': {
                            example: {
                                error: 'Rating ID is required'
                            }
                        }
                    }
                },
                404: {
                    description: 'Not Found',
                    content: {
                        'application/json': {
                            example: {
                                error: 'Rating not found'
                            }
                        }
                    }
                }
            }
        }
    },
    '/properties/ratings/{id}/helpful': {
        put: {
            summary: 'Toggle rating helpful status for current Authenticated User',
            tags: ['Property Ratings'],
            security: [{bearerAuth: []}],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    required: true,
                    schema: {type: 'string'},
                    description: 'Rating ID'
                }
            ],
            responses: {
                200: {
                    description: 'Rating helpful status toggled successfully',
                    content: {
                        'application/json': {
                            schema: {
                                allOf: [
                                    {$ref: '#/components/schemas/Rating'},
                                    {
                                        properties: {
                                            helpful: {
                                                type: 'number',
                                                description: 'Number of users who found this helpful'
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
                            example: {
                                error: 'Rating ID is required'
                            }
                        }
                    }
                },
                403: {
                    description: 'Forbidden',
                    content: {
                        'application/json': {
                            example: {
                                error: 'You cannot mark your own rating as helpful'
                            }
                        }
                    }
                },
                404: {
                    description: 'Not Found',
                    content: {
                        'application/json': {
                            example: {
                                error: 'Rating not found'
                            }
                        }
                    }
                }
            }
        }
    },
    '/properties/{propertyId}/ratings': {
        get: {
            summary: 'Get ratings for a property',
            tags: ['Property Ratings'],
            parameters: [
                {
                    in: 'path',
                    name: 'propertyId',
                    required: true,
                    schema: {type: 'string'},
                    description: 'Property ID'
                }
            ],
            responses: {
                200: {
                    description: 'Ratings retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    $ref: '#/components/schemas/RatingResponsePopulated'
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'Bad Request',
                    content: {
                        'application/json': {
                            example: {
                                error: 'Property ID is required'
                            }
                        }
                    }
                }
            }
        }
    }
}
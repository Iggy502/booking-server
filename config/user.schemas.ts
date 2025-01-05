// src/docs/user.docs.ts

export const userSchemas = {
    UserBase: {
        type: 'object',
        required: ['email', 'firstName', 'lastName', 'phone', 'password', 'roles'],
        properties: {
            email: {
                type: 'string',
                description: 'User email'
            },
            firstName: {
                type: 'string',
                description: 'User first name'
            },
            lastName: {
                type: 'string',
                description: 'User last name'
            },
            phone: {
                type: 'string',
                description: 'User phone number'
            },
            password: {
                type: 'string',
                description: 'User password'
            },
            profilePicturePath: {
                type: 'string',
                description: 'Profile picture path'
            },
            roles: {
                type: 'array',
                items: {
                    type: 'string',
                    enum: ['USER', 'ADMIN']
                },
                description: 'User roles'
            }
        }
    },
    UserResponse: {
        type: 'object',
        required: ['id', 'email', 'firstName', 'lastName', 'phone', 'roles'],
        properties: {
            id: {
                type: 'string',
                description: 'User ID'
            },
            email: {
                type: 'string',
                description: 'User email'
            },
            firstName: {
                type: 'string',
                description: 'User first name'
            },
            lastName: {
                type: 'string',
                description: 'User last name'
            },
            phone: {
                type: 'string',
                description: 'User phone number'
            },
            profilePicturePath: {
                type: 'string',
                description: 'Profile picture path'
            },
            roles: {
                type: 'array',
                items: {
                    type: 'string',
                    enum: ['USER', 'ADMIN']
                },
                description: 'User roles'
            }
        },
        example: {
            id: '6507ebbd7c2e8c9c9c9c9c9c',
            email: 'user@example.com',
            firstName: 'John',
            lastName: 'Doe',
            phone: '+1234567890',
            profilePicturePath: '/profiles/user.jpg',
            roles: ['USER']
        }
    }
};

export const userPaths = {
    '/users': {
        post: {
            summary: 'Create a new user',
            tags: ['Users'],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['email', 'firstName', 'lastName', 'phone', 'password'],
                            properties: {
                                email: {
                                    type: 'string',
                                    example: 'user@example.com'
                                },
                                firstName: {
                                    type: 'string',
                                    example: 'John'
                                },
                                lastName: {
                                    type: 'string',
                                    example: 'Doe'
                                },
                                phone: {
                                    type: 'string',
                                    example: '+1234567890'
                                },
                                password: {
                                    type: 'string',
                                    example: 'password123'
                                },
                                roles: {
                                    type: 'array',
                                    items: {
                                        type: 'string',
                                        enum: ['USER', 'ADMIN']
                                    },
                                    example: ['USER']
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                201: {
                    description: 'User created successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/UserResponse'
                            }
                        }
                    }
                },
                400: {
                    description: 'Bad Request',
                    content: {
                        'application/json': {
                            example: {
                                error: 'User with this email or phone already exists'
                            }
                        }
                    }
                }
            }
        }
    },
    '/users/{id}': {
        get: {
            summary: 'Get a user by ID',
            tags: ['Users'],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    required: true,
                    schema: { type: 'string' },
                    description: 'User ID'
                }
            ],
            responses: {
                200: {
                    description: 'User retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/UserResponse'
                            }
                        }
                    }
                },
                404: {
                    description: 'User not found',
                    content: {
                        'application/json': {
                            example: {
                                error: 'User not found'
                            }
                        }
                    }
                }
            }
        },
        put: {
            summary: 'Update a user',
            tags: ['Users'],
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    required: true,
                    schema: { type: 'string' },
                    description: 'User ID'
                }
            ],
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                email: { type: 'string' },
                                firstName: { type: 'string' },
                                lastName: { type: 'string' },
                                phone: { type: 'string' },
                                profilePicturePath: { type: 'string' },
                                roles: {
                                    type: 'array',
                                    items: {
                                        type: 'string',
                                        enum: ['USER', 'ADMIN']
                                    }
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'User updated successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/UserResponse'
                            }
                        }
                    }
                },
                400: {
                    description: 'Bad Request',
                    content: {
                        'application/json': {
                            example: {
                                error: 'User with this email or phone already exists'
                            }
                        }
                    }
                },
                403: {
                    description: 'Forbidden',
                    content: {
                        'application/json': {
                            example: {
                                error: 'Only admins can update other users'
                            }
                        }
                    }
                },
                404: {
                    description: 'User not found',
                    content: {
                        'application/json': {
                            example: {
                                error: 'User not found'
                            }
                        }
                    }
                }
            }
        },
        delete: {
            summary: 'Delete a user',
            tags: ['Users'],
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    in: 'path',
                    name: 'id',
                    required: true,
                    schema: { type: 'string' },
                    description: 'User ID'
                }
            ],
            responses: {
                200: {
                    description: 'User deleted successfully',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/UserResponse'
                            }
                        }
                    }
                },
                404: {
                    description: 'User not found',
                    content: {
                        'application/json': {
                            example: {
                                error: 'User not found'
                            }
                        }
                    }
                }
            }
        }
    }
};
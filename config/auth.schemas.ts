export const authSchemas = {
    LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
            email: {
                type: 'string',
                description: 'User email'
            },
            password: {
                type: 'string',
                description: 'User password'
            }
        }
    },
    TokenResponse: {
        type: 'object',
        required: ['accessToken'],
        properties: {
            accessToken: {
                type: 'string',
                description: 'JWT access token'
            }
        }
    },
    SessionResponse: {
        type: 'object',
        properties: {
            deviceInfo: {
                type: 'string',
                description: 'Device information'
            },
            lastUsed: {
                type: 'string',
                format: 'date-time',
                description: 'Last time the session was used'
            }
        }
    }
};

export const authPaths = {
    '/auth/login': {
        post: {
            summary: 'Login user',
            tags: ['Auth'],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            $ref: '#/components/schemas/LoginRequest'
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Login successful',
                    headers: {
                        'Set-Cookie': {
                            description: 'HTTP-only refresh token cookie',
                            schema: {
                                type: 'string'
                            }
                        }
                    },
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    accessToken: {
                                        type: 'string'
                                    }
                                }
                            }
                        }
                    }
                },
                401: {
                    description: 'Unauthorized',
                    content: {
                        'application/json': {
                            example: {
                                error: 'Invalid credentials'
                            }
                        }
                    }
                }
            }
        }
    },
    '/auth/refresh-token': {
        post: {
            summary: 'Refresh access token',
            tags: ['Auth'],
            parameters: [
                {
                    in: 'cookie',
                    name: 'refreshToken',
                    required: true,
                    schema: {
                        type: 'string'
                    },
                    description: 'Refresh token cookie'
                }
            ],
            responses: {
                200: {
                    description: 'Token refreshed successfully',
                    headers: {
                        'Set-Cookie': {
                            description: 'HTTP-only refresh token cookie',
                            schema: {
                                type: 'string'
                            }
                        }
                    },
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/TokenResponse'
                            }
                        }
                    }
                },
                401: {
                    description: 'Unauthorized',
                    content: {
                        'application/json': {
                            examples: {
                                noToken: {
                                    value: {
                                        error: 'No refresh token provided'
                                    }
                                },
                                invalidToken: {
                                    value: {
                                        error: 'Invalid refresh token'
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/auth/initiate-password-reset': {
        post: {
            summary: 'Initiate password reset',
            tags: ['Auth'],
            requestBody: {
                required: true,
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            required: ['email'],
                            properties: {
                                email: {
                                    type: 'string',
                                    description: 'User email'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Password reset initiated',
                    content: {
                        'application/json': {
                            example: {
                                message: 'Password reset initiated successfully'
                            }
                        }
                    }
                },
                401: {
                    description: 'Unauthorized',
                    content: {
                        'application/json': {
                            example: {
                                error: 'User Not Found'
                            }
                        }
                    }
                },
                500: {
                    description: 'Internal Server Error',
                    content: {
                        'application/json': {
                            example: {
                                error: 'Failed to generate reset token'
                            }
                        }
                    }
                }
            }
        }
    },
    '/auth/sessions': {
        get: {
            summary: 'List active sessions',
            tags: ['Auth'],
            security: [{bearerAuth: []}],
            responses: {
                200: {
                    description: 'Active sessions retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'array',
                                items: {
                                    $ref: '#/components/schemas/SessionResponse'
                                }
                            },
                            example: [
                                {
                                    deviceInfo: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                    lastUsed: '2024-01-05T14:30:00.000Z'
                                },
                                {
                                    deviceInfo: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
                                    lastUsed: '2024-01-05T10:15:00.000Z'
                                }
                            ]
                        }
                    }
                },
                500: {
                    description: 'Internal Server Error',
                    content: {
                        'application/json': {
                            example: {
                                error: 'Failed to list sessions'
                            }
                        }
                    }
                }
            }
        }
    }
};
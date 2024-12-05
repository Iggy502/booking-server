// src/__tests__/integration/image.upload.service.test.ts
import 'reflect-metadata';
import {MongoMemoryServer} from 'mongodb-memory-server';
import mongoose from 'mongoose';
import {container} from 'tsyringe';
import {ImageUploadService, UploadType} from '../../services/image.upload.service';
import {Property} from '../../models/property.model';
import {User} from '../../models/user.model';
import {GeocodingService} from '../../services/geocoding.service';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import {UserRole} from "../../models/interfaces";

// Load environment variables
dotenv.config();

// Mock GeocodingService
const mockGeocodingService = {
    getCoordinates: jest.fn().mockResolvedValue({
        latitude: 40.7128,
        longitude: -74.0060
    })
} as unknown as GeocodingService;

describe('ImageUploadService Integration Tests', () => {
    let mongod: MongoMemoryServer;
    let imageUploadService: ImageUploadService;
    let testUser: any;
    let testProperty: any;

    beforeAll(async () => {
        // Setup MongoDB Memory Server
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        await mongoose.connect(uri);

        // Register mock GeocodingService
        container.registerInstance(GeocodingService, mockGeocodingService);

        // Initialize service
        imageUploadService = container.resolve(ImageUploadService);

        // Create test user
        testUser = await User.create({
            email: 'test@example.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User',
            phone: '123456789',
            roles: [UserRole.USER]
        });

        // Create test property
        testProperty = await Property.create({
            name: 'Test Property',
            owner: testUser._id,
            description: 'Test Description',
            address: {
                street: '123 Test St',
                city: 'Test City',
                country: 'Test Country',
                postalCode: '12345'
            },
            pricePerNight: 100,
            maxGuests: 4
        });
    });

    afterEach(async () => {
        // Clean up properties and reset their images after each test
        await Property.updateMany({}, {$set: {imagePaths: []}});
        await User.updateMany({}, {$unset: {profileImage: 1}});
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongod.stop();
    });

    describe('Profile Image Upload', () => {
        it('should upload profile image and update user', async () => {
            const testImagePath = path.join(__dirname, './fixtures/test-image.png');
            const imageBuffer = fs.readFileSync(testImagePath);
            const mockFile = {
                buffer: imageBuffer,
                originalname: 'test-image.png',
                mimetype: 'image/png'
            } as Express.Multer.File;

            const imageUrl = await imageUploadService.uploadImage(
                mockFile,
                UploadType.PROFILE,
                {userId: testUser._id.toString()}
            );

            expect(imageUrl).toMatch(/^https:\/\/.+\.amazonaws\.com\/profiles\/.+/);

            const updatedUser = await User.findById(testUser._id);
            expect(updatedUser?.profilePicturePath).toBe(imageUrl);
        }, 10000);
    });

    describe('Property Images Upload', () => {
        it('should upload property image and update property imagePaths', async () => {
            const testImagePath = path.join(__dirname, '../fixtures/test-image.jpg');
            const imageBuffer = fs.readFileSync(testImagePath);
            const mockFile = {
                buffer: imageBuffer,
                originalname: 'test-image.png',
                mimetype: 'image/png'
            } as Express.Multer.File;

            const imageUrl = await imageUploadService.uploadImage(
                mockFile,
                UploadType.PROPERTY,
                {propertyId: testProperty._id.toString()}
            );

            expect(imageUrl).toMatch(/^https:\/\/.+\.amazonaws\.com\/properties\/.+/);

            const updatedProperty = await Property.findById(testProperty._id);
            expect(updatedProperty?.imagePaths).toContain(imageUrl);
        }, 10000);

        it('should handle invalid upload type', async () => {
            const testImagePath = path.join(__dirname, './fixtures/test-image.png');
            const imageBuffer = fs.readFileSync(testImagePath);
            const mockFile = {
                buffer: imageBuffer,
                originalname: 'test-image.png',
                mimetype: 'image/png'
            } as Express.Multer.File;

            await expect(imageUploadService.uploadImage(
                mockFile,
                'invalid' as UploadType,
                {propertyId: testProperty._id.toString()}
            )).rejects.toThrow('Invalid upload type');
        });

        it('should require propertyId for property uploads', async () => {
            const testImagePath = path.join(__dirname, './fixtures/test-image.png');
            const imageBuffer = fs.readFileSync(testImagePath);
            const mockFile = {
                buffer: imageBuffer,
                originalname: 'test-image.png',
                mimetype: 'image/png'
            } as Express.Multer.File;

            await expect(imageUploadService.uploadImage(
                mockFile,
                UploadType.PROPERTY,
                undefined
            )).rejects.toThrow('Property ID is required for property images');
        });
    });
});
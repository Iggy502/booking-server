// import 'reflect-metadata';
// import {MongoMemoryServer} from 'mongodb-memory-server';
// import mongoose from 'mongoose';
// import {container} from 'tsyringe';
// import {ImageUploadService, UploadType} from '../image.upload.service';
// import {Property} from '../../models/property.model';
// import {User} from '../../models/user.model';
// import {GeocodingService} from '../geocoding.service';
// import path from 'path';
// import fs from 'fs';
// import dotenv from 'dotenv';
// import {UserRole} from "../../models/interfaces";
//
// // Load environment variables
// dotenv.config();
//
// const mockGeocodingService = {
//     getCoordinates: jest.fn().mockResolvedValue({
//         latitude: 40.7128,
//         longitude: -74.0060
//     })
// } as unknown as GeocodingService;
//
// describe('ImageUploadService Integration Tests', () => {
//     let mongod: MongoMemoryServer;
//     let imageUploadService: ImageUploadService;
//     let testUser: any;
//     let testProperty: any;
//
//     beforeAll(async () => {
//         mongod = await MongoMemoryServer.create();
//         const uri = mongod.getUri();
//         await mongoose.connect(uri);
//
//         container.registerInstance(GeocodingService, mockGeocodingService);
//         imageUploadService = container.resolve(ImageUploadService);
//
//         // Create test user
//         testUser = await User.create({
//             email: 'test@example.com',
//             password: 'password123',
//             firstName: 'Test',
//             lastName: 'User',
//             phone: '123456789',
//             roles: [UserRole.USER]
//         });
//
//         // Create test property
//         testProperty = await Property.create({
//             name: 'Test Property',
//             owner: testUser._id,
//             description: 'Test Description',
//             address: {
//                 street: '123 Test St',
//                 city: 'Test City',
//                 country: 'Test Country',
//                 postalCode: '12345'
//             },
//             pricePerNight: 100,
//             maxGuests: 4
//         });
//     });
//
//     afterAll(async () => {
//         await mongoose.disconnect();
//         await mongod.stop();
//     });
//
//     describe('Profile Image Upload', () => {
//         it('should upload and update user profile image', async () => {
//             const testImagePath = path.join(__dirname, './fixtures/test-image.png');
//             const imageBuffer = fs.readFileSync(testImagePath);
//             const mockFile = {
//                 buffer: imageBuffer,
//                 originalname: 'test-image.png',
//                 mimetype: 'image/png'
//             } as Express.Multer.File;
//
//             const updatedUser = await imageUploadService.uploadProfileImage(
//                 mockFile,
//                 {userId: testUser._id.toString()}
//             );
//
//             expect(updatedUser.profilePicturePath).toMatch(/^https:\/\/.+\.amazonaws\.com\/profiles\/.+/);
//
//             const dbUser = await User.findById(testUser._id);
//             expect(dbUser?.profilePicturePath).toBe(updatedUser.profilePicturePath);
//         }, 10000);
//
//         it('should delete profile image', async () => {
//             // First upload an image
//             const testImagePath = path.join(__dirname, './fixtures/test-image.png');
//             const imageBuffer = fs.readFileSync(testImagePath);
//             const mockFile = {
//                 buffer: imageBuffer,
//                 originalname: 'test-image.png',
//                 mimetype: 'image/png'
//             } as Express.Multer.File;
//
//             const updatedUser = await imageUploadService.uploadProfileImage(
//                 mockFile,
//                 {userId: testUser._id.toString()}
//             );
//
//             // Then delete it
//             const imagePath = updatedUser.profilePicturePath;
//
//             if (!imagePath) {
//                 fail('Profile image path is empty');
//             }
//
//             await imageUploadService.deleteProfileImage(testUser._id.toString(), imagePath);
//
//             const dbUser = await User.findById(testUser._id);
//             expect(dbUser?.profilePicturePath).toBe('');
//         }, 15000);
//     });
//
//     describe('Property Images Upload', () => {
//         it('should upload multiple property images', async () => {
//             const testImagePath = path.join(__dirname, './fixtures/test-image.png');
//             const imageBuffer = fs.readFileSync(testImagePath);
//             const mockFiles = [
//                 {
//                     buffer: imageBuffer,
//                     originalname: 'test-image-1.png',
//                     mimetype: 'image/png'
//                 },
//                 {
//                     buffer: imageBuffer,
//                     originalname: 'test-image-2.png',
//                     mimetype: 'image/png'
//                 }
//             ] as Express.Multer.File[];
//
//             const updatedProperty = await imageUploadService.uploadPropertyImages(
//                 mockFiles,
//                 UploadType.PROPERTY,
//                 {propertyId: testProperty._id.toString()}
//             );
//
//             expect(updatedProperty.imagePaths).toHaveLength(2);
//             updatedProperty.imagePaths?.forEach(path => {
//                 expect(path).toMatch(/^https:\/\/.+\.amazonaws\.com\/properties\/.+/);
//             });
//
//             const dbProperty = await Property.findById(testProperty._id);
//             expect(dbProperty?.imagePaths).toEqual(updatedProperty.imagePaths);
//         }, 15000);
//
//         it('should delete property image', async () => {
//             // First upload an image
//             const testImagePath = path.join(__dirname, './fixtures/test-image.png');
//             const imageBuffer = fs.readFileSync(testImagePath);
//             const mockFiles = [{
//                 buffer: imageBuffer,
//                 originalname: 'test-image.png',
//                 mimetype: 'image/png'
//             }] as Express.Multer.File[];
//
//             const updatedProperty = await imageUploadService.uploadPropertyImages(
//                 mockFiles,
//                 UploadType.PROPERTY,
//                 {propertyId: testProperty._id.toString()}
//             );
//
//             // Then delete it
//             const imagePath = updatedProperty.imagePaths?.[0] || '';
//             await imageUploadService.deletePropertyImage(testProperty._id.toString(), imagePath);
//
//             const dbProperty = await Property.findById(testProperty._id);
//             expect(dbProperty?.imagePaths).not.toContain(imagePath);
//         }, 15000);
//     });
// });
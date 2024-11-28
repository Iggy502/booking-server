import 'reflect-metadata';
import {container} from 'tsyringe';
import mongoose from 'mongoose';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {UserService} from '../user.service';
import {User} from '../../models/user.model';
import {IUserCreate, UserRole} from '../../models/interfaces';
import {HttpError} from "../exceptions/http-error";

describe('UserService Integration Tests', () => {
    let userService: UserService;
    let mongoServer: MongoMemoryServer;

    beforeAll(async () => {
        // Create MongoDB Instance
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();

        await mongoose.connect(mongoUri);
        userService = container.resolve(UserService);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        await User.deleteMany({});
    });

    it('should create a user', async () => {
        const userData: IUserCreate = {
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            phone: '1234567890',
            password: 'password123',
            roles: [UserRole.USER],
        };

        const result = await userService.createUser(userData);

        expect(result).toBeDefined();
        expect(result.email).toBe(userData.email);
        expect(result.firstName).toBe(userData.firstName);
        expect(result.lastName).toBe(userData.lastName);
        expect(result.phone).toBe(userData.phone);
        expect(result.id).toBeDefined();

        // Verify user was actually saved to database
        const savedUser = await User.findById(result.id);
        expect(savedUser).toBeDefined();
        expect(savedUser?.email).toBe(userData.email);
    });

    it('should get a user by id', async () => {
        const userData: IUserCreate = {
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            phone: '1234567890',
            password: 'password123',
            roles: [UserRole.USER],
        };
        const createdUser = await userService.createUser(userData);

        const result = await userService.getUserById(createdUser.id);

        expect(result).toBeDefined();
        expect(result.id).toStrictEqual(createdUser.id);
        expect(result.email).toBe(userData.email);
    });

    it('should update a user', async () => {
        const userData: IUserCreate = {
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            phone: '1234567890',
            password: 'password123',
            roles: [UserRole.USER],
        };
        const createdUser = await userService.createUser(userData);

        const updateData = { firstName: 'Updated' };
        const result = await userService.updateUser(createdUser.id, updateData);

        expect(result).toBeDefined();
        expect(result.firstName).toBe(updateData.firstName);

        const updatedUser = await User.findById(createdUser.id);
        expect(updatedUser?.firstName).toBe(updateData.firstName);
    });

    it('should delete a user', async () => {
        const userData: IUserCreate = {
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            phone: '1234567890',
            password: 'password123',
            roles: [UserRole.USER],
        };
        const createdUser = await userService.createUser(userData);

        const result = await userService.deleteUser(createdUser.id);

        expect(result).toBeDefined();
        expect(result.id).toStrictEqual(createdUser.id);

        const deletedUser = await User.findById(createdUser.id);
        expect(deletedUser).toBeNull();
    });

    it('should handle non-existent user', async () => {
        const nonExistentId = new mongoose.Types.ObjectId().toString();

        await expect(userService.getUserById(nonExistentId))
            .rejects
            .toThrow(new HttpError(404, 'User not found'));
    });

    it('should handle duplicate email addresses', async () => {
        const userData: IUserCreate = {
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            phone: '1234567890',
            password: 'password123',
            roles: [UserRole.USER],
        };

        await userService.createUser(userData);

        await expect(userService.createUser(userData))
            .rejects
            .toThrow(/duplicate key error/i);
    });
});
import 'reflect-metadata';
import {container} from 'tsyringe';
import {UserService} from '../user.service';
import {User} from '../../models/user.model';
import {IUserCreate, IUserResponse} from '../../models/interfaces';
import mongoose from 'mongoose';

jest.mock('../../models/user.model');

describe('UserService', () => {
    const mockUserId = new mongoose.Types.ObjectId().toString();
    const mockUser: IUserResponse = {
        id: mockUserId,
        email: 'test@example.com',
        name: 'Test User',
        phone: '1234567890',
        createdAt: new Date(),
        updatedAt: new Date(),
    };


    let userService: UserService;


    beforeAll(() => {
        userService = container.resolve(UserService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create a user', async () => {
        const userData: IUserCreate = {
            email: 'test@example.com',
            name: 'Test User',
            phone: '1234567890',
            password: 'password123',
        };

        (User.create as jest.Mock).mockResolvedValue({
            ...mockUser,
            toObject: () => mockUser,
        });

        const result = await userService.createUser(userData);
        expect(result).toEqual(mockUser);
        expect(User.create).toHaveBeenCalledWith(userData);

    });

    it('should get a user by id', async () => {
        (User.findById as jest.Mock).mockResolvedValue({
            ...mockUser,
            toObject: () => mockUser,
        });

        const result = await userService.getUserById(mockUserId);
        expect(result).toEqual(mockUser);
        expect(User.findById).toHaveBeenCalledWith(mockUserId);
    });

    it('should update a user', async () => {
        const updateData = {name: 'Updated User'};

        (User.findByIdAndUpdate as jest.Mock).mockResolvedValue({
            ...mockUser,
            ...updateData,
            toObject: () => ({...mockUser, ...updateData}),
        });

        const result = await userService.updateUser(mockUserId, updateData);
        expect(result).toEqual({...mockUser, ...updateData});
        expect(User.findByIdAndUpdate).toHaveBeenCalledWith(mockUserId, updateData, {new: true});
    });

    it('should delete a user', async () => {
        (User.findByIdAndDelete as jest.Mock).mockResolvedValue({
            ...mockUser,
            toObject: () => mockUser,
        });

        const result = await userService.deleteUser(mockUserId);
        expect(result).toEqual(mockUser);
        expect(User.findByIdAndDelete).toHaveBeenCalledWith(mockUserId);
    });
});
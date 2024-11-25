// src/models/user.model.ts
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
//Automatically scans for index file if given path is a folder
import {IUserDocument, IUserModel} from './interfaces';

const userSchema = new mongoose.Schema<IUserDocument>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            select: false,
        },
    },
    {
        timestamps: true,
        toObject: {
            transform: (doc, ret) => {
                ret.id = ret._id;
                delete ret._id;
                delete ret.createdAt;
                delete ret.updatedAt;
                delete ret.__v;
                delete ret.password
                const {id, ...rest} = ret;
                return {id, ...rest};
            }


        }
    }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
});

//virtual property to get full name
userSchema.virtual('fullName').get(function (this: IUserDocument) {
    return `${this.firstName} ${this.lastName}`;
});

//virtual to set full name
userSchema.virtual('fullName').set(function (this: IUserDocument, fullName: string) {
    const [firstName, lastName] = fullName.split(' ');
    this.firstName = firstName;
    this.lastName = lastName;
});


// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    const user: IUserDocument = await User.findById(this._id).select({password: 1});
    if (!user?.password) throw new Error('Password not found');
    return bcrypt.compare(candidatePassword, user.password);
};

export const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);


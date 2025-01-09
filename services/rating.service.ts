import {injectable} from 'tsyringe';
import {Property} from '../models/property.model';
import {Rating} from '../models/rating.model';
import {
    IRatingCreate,
    IRatingDocument,
    IRatingDocumentPopulated,
    IRatingResponse,
    IRatingResponsePopulated
} from '../models/interfaces/rating.types';
import {Forbidden, NotFound} from 'http-errors';
import mongoose from 'mongoose';
import {ImageConversionUtil} from "./util/image/image-conversion-util";

@injectable()
export class RatingService {
    async createRating(data: IRatingCreate): Promise<IRatingResponsePopulated[]> {

        await Rating.create({
            ...data,
            user: new mongoose.Types.ObjectId(data.userId),
            property: new mongoose.Types.ObjectId(data.propertyId)
        });

        const currentRatings = await Rating.find({property: data.propertyId})

        const totalRatings = currentRatings.length;
        const averageRating = currentRatings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;

        await Property.findByIdAndUpdate(data.propertyId, {
            averageRating,
            totalRatings
        });

        const latestRatingsPopulated = await Rating.find({property: data.propertyId})
            .populate<IRatingDocumentPopulated>('user', 'firstName lastName profilePicturePath')
            .populate<IRatingDocumentPopulated>('property', 'name averageRating totalRatings')
            .sort({createdAt: -1}) as IRatingDocumentPopulated[];

        return latestRatingsPopulated.map(rating => this.mapToPopulatedRatingResponse(rating));

    }

    async getPopulatedRatingsByPropertyId(propertyId: string): Promise<IRatingResponsePopulated[]> {
        const ratingsPopulated = await Rating.find({property: propertyId})
            .populate<IRatingDocumentPopulated>('user', 'firstName lastName profilePicturePath')
            .populate<IRatingDocumentPopulated>('property', 'name averageRating totalRatings')
            .sort({createdAt: -1}) as IRatingDocumentPopulated[];

        return ratingsPopulated.map(rating => this.mapToPopulatedRatingResponse(rating));

    }

    async getRatingsByPropertyId(propertyId: string): Promise<IRatingResponse[]> {
        const ratings = await Rating.find({property: propertyId});
        return ratings.map(rating => this.mapToRatingResponse(rating));
    }

    async updateRating(ratingId: string, data: Partial<Pick<IRatingCreate, 'rating' | 'review'>>): Promise<IRatingResponsePopulated> {
        const rating = await Rating.findOneAndUpdate(
            {_id: ratingId},
            {rating: data.rating, review: data.review},
            {new: true}
        ).populate<IRatingDocumentPopulated>([
            {path: 'user', select: 'id firstName lastName profilePicturePath'},
            {path: 'property', select: 'id name averageRating totalRatings'}
        ]);

        if (!rating) {
            throw NotFound('Rating not found');
        }

        if (!rating.property) {
            throw NotFound('Property not found');
        }

        // Update property statistics
        const ratings = await Rating.find({property: rating.property.id});
        const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

        await Property.findByIdAndUpdate(rating.property, {
            avgRating: averageRating
        });

        return this.mapToPopulatedRatingResponse(rating);
    }

    // Delete rating and return ratings to avoid additional query
    async deleteRating(ratingId: string): Promise<IRatingResponsePopulated[]> {
        const rating = await Rating.findOne({_id: ratingId});

        if (!rating) {
            throw NotFound('Rating not found');
        }

        await Rating.deleteOne({_id: ratingId});

        const propertyForRating = await Property.exists({_id: rating.property})

        // Update property statistics
        if (propertyForRating) {
            const ratings = await Rating.find({property: rating.property});
            const totalRatings = ratings.length;
            const averageRating = totalRatings > 0
                ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
                : 0;

            await Property.findByIdAndUpdate(rating.property, {
                averageRating,
                totalRatings
            });
        }

        return await this.getPopulatedRatingsByPropertyId(rating.property.toString());

    }

    async toggleHelpful(ratingId: string, userId: string): Promise<IRatingResponse> {
        const rating = await Rating.findById(ratingId);

        if (!rating) {
            throw NotFound('Rating not found');
        }

        if (rating.user.toString() == userId) {
            throw Forbidden('You cannot mark your own rating as helpful');
        }

        const helpfulIndex = rating.helpful.indexOf(new mongoose.Types.ObjectId(userId));
        if (helpfulIndex === -1) {
            rating.helpful.push(new mongoose.Types.ObjectId(userId));
        } else {
            rating.helpful.splice(helpfulIndex, 1);
        }

        const updatedRating = await rating.save();

        return this.mapToRatingResponse(updatedRating);
    }

    private mapToPopulatedRatingResponse(rating: IRatingDocumentPopulated): IRatingResponsePopulated {

        let populatedRatingResponse = rating?.toObject() as IRatingResponsePopulated;

        if (rating?.user?.profilePicturePath) {
            populatedRatingResponse.user.profilePicturePath =
                ImageConversionUtil.convertPathToUrl(rating.user.profilePicturePath, process.env.AWS_S3_BUCKET || '');

        }

        populatedRatingResponse.helpful = rating.helpful.length;

        return populatedRatingResponse;

    }


    private mapToRatingResponse(rating: IRatingDocument): IRatingResponse {
        let ratingResponse = rating.toObject() as IRatingResponse;
        ratingResponse.helpful = rating.helpful.length;

        return ratingResponse;

    }

}
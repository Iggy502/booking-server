import {BadRequest} from "http-errors";

export class ImageConversionUtil {
    static convertUrlToPath(url: string, bucket: string): string {
        if (!url || !bucket) {
            throw BadRequest('Invalid URL or bucket name');
        }

        return url.replace(`https://${bucket || ' '}.s3.${process.env.AWS_REGION}.amazonaws.com/`, '');
    }

    static convertPathToUrl(path: string, bucket: string): string {
        if (!path || !bucket) {
            throw BadRequest('Invalid path or bucket name');
        }

        return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${path}`;
    }
}
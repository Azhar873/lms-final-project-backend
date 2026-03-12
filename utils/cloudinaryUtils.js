const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

/**
 * Uploads a buffer to Cloudinary using a stream.
 * @param {Buffer} buffer - The file buffer.
 * @param {string} folder - The Cloudinary folder to upload to.
 * @param {string} resourceType - 'auto', 'image', or 'video'.
 * @returns {Promise<object>} - The Cloudinary upload result.
 */
const uploadFromBuffer = (buffer, folder, resourceType = 'auto') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `lms/${folder}`,
                resource_type: resourceType,
            },
            (error, result) => {
                if (result) {
                    resolve(result);
                } else {
                    reject(error);
                }
            }
        );

        streamifier.createReadStream(buffer).pipe(uploadStream);
    });
};

/**
 * Uploads a large file to Cloudinary using chunked upload.
 * @param {string} filePath - The local file path.
 * @param {string} folder - The Cloudinary folder to upload to.
 * @param {string} resourceType - 'auto', 'image', or 'video'.
 * @returns {Promise<object>} - The Cloudinary upload result.
 */
const uploadLargeFile = (filePath, folder, resourceType = 'auto') => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_large(
            filePath,
            {
                folder: `lms/${folder}`,
                resource_type: resourceType,
            },
            (error, result) => {
                if (result) {
                    resolve(result);
                } else {
                    reject(error);
                }
            }
        );
    });
};

module.exports = { uploadFromBuffer, uploadLargeFile };

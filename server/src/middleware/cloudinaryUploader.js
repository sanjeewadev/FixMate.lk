const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinaryConfig');

// dynamic uploader function
const getUploadMiddleware = (folder) => {
  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `fixmate/${folder}`,
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp']
    }
  });

  return multer({ storage: storage });
};

module.exports = getUploadMiddleware;

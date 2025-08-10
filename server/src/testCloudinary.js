const cloudinary = require('./config/cloudinaryConfig');

cloudinary.api.ping()
  .then(response => {
    console.log("✅ Cloudinary connection successful!");
    console.log(response);
  })
  .catch(err => {
    console.error("❌ Cloudinary connection failed.");
    console.error(err);
  });

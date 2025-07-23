const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');
const path = require('path');

const allowedImageTypes = ['image/png', 'image/jpg', 'image/jpeg'];
const allowedResumeTypes = ['.pdf', '.docx', '.doc'];

// Storage for profilePhoto & companyLogo
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'jobportal/images',
    allowed_formats: ['jpg', 'png', 'jpeg'],
    public_id: (req, file) => file.originalname.split('.')[0] + '-' + Date.now()
  }
});

// Storage for user resume
const resumeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'jobportal/user-resumes',
    allowed_formats: ['pdf', 'docx', 'doc'],
    public_id: (req, file) => file.originalname.split('.')[0] + '-' + Date.now()
  }
});
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      let folder = '';
      let resource_type = 'auto';
  
      if (file.fieldname === 'profilePhoto') {
        folder = 'jobportal/profilePhotos';
        resource_type = 'image';
      } else if (file.fieldname === 'resume') {
        folder = 'jobportal/user-resumes';
        resource_type = 'raw';
      } else {
        throw new Error('Unexpected fieldname');
      }
  
      return {
        folder: folder,
        allowed_formats: file.fieldname === 'profilePhoto' ? ['jpg', 'png', 'jpeg'] : ['pdf', 'docx', 'doc'],
        public_id: file.originalname.split('.')[0] + '-' + Date.now(),
        resource_type,
      };
    }
  });
  
  const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'profilePhoto') {
      if (allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only JPG, PNG, JPEG images are allowed'), false);
      }
    } else if (file.fieldname === 'resume') {
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedResumeTypes.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Only PDF, DOCX, DOC files are allowed'), false);
      }
    } else {
      cb(new Error('Unexpected fieldname'), false);
    }
  };

// Storage for chatbot resume
const chatbotResumeStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'jobportal/chat-resumes',
    allowed_formats: ['pdf', 'docx'],
    public_id: (req, file) => file.originalname.split('.')[0] + '-' + Date.now()
  }
});

const imageFilter = (req, file, cb) => {
  if (allowedImageTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, JPEG images are allowed'), false);
  }
};

const resumeFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedResumeTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, DOCX, DOC files are allowed'), false);
  }
};

const uploadProfile = multer({ storage, fileFilter });
const uploadCompanyLogo = multer({ storage: imageStorage, fileFilter: imageFilter });
const uploadUserResume = multer({ storage: resumeStorage, fileFilter: resumeFilter });
const uploadChatbotResume = multer({ storage: chatbotResumeStorage, fileFilter: resumeFilter });


const clearImage = async (cloudinaryUrl) => {
  if (!cloudinaryUrl) return;

  try {
    // Cloudinary URL format:
    // https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/<public_id>.<format>
    const parts = cloudinaryUrl.split('/');
    const publicIdWithExtension = parts.slice(-1)[0]; // eg: filename-12345678.jpg
    const folder = parts.slice(parts.indexOf('jobportal')).slice(0, -1).join('/'); // eg: jobportal/images

    const publicId = `${folder}/${publicIdWithExtension.split('.')[0]}`; // eg: jobportal/images/filename-12345678

    await cloudinary.uploader.destroy(publicId);
    console.log(`Deleted file from Cloudinary: ${publicId}`);
  } catch (err) {
    console.error('Failed to delete file from Cloudinary:', err.message);
  }
};




module.exports = {
  clearImage,
  uploadProfile,
  uploadCompanyLogo,
  uploadUserResume,
  uploadChatbotResume
};

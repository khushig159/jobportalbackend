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
    public_id: (req, file) => {
        const { name } = path.parse(file.originalname);
        return `${name}-${Date.now()}`;
      }  }
});

// Storage for user resume

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      let folder = '';
      let resource_type = '';
      // let type='upload'
      if (file.fieldname === 'resume') {
        folder = 'jobportal/user-resumes';
        resource_type='auto'
      }
       else if (file.fieldname === 'profilePhoto') {
        folder = 'jobportal/profilePhotos';
        resource_type = 'image';
      } else {
        throw new Error('Unexpected fieldname');
      }
      const { name, ext } = path.parse(file.originalname);

      return {
        folder: folder,
        allowed_formats: file.fieldname === 'profilePhoto' ? ['jpg', 'png', 'jpeg'] : ['pdf', 'docx', 'doc'],
        public_id: `${name}-${Date.now()}`,
        // resource_type,
        // type
      };
    }
  });
  
  const fileFilter = (req, file, cb) => {
    console.log('📝 Received:', file.fieldname, file.originalname, file.mimetype);

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
    params: async (req, file) => {
        const { name, ext } = path.parse(file.originalname);
      return {
        folder: 'jobportal/chat-resumes',
        allowed_formats: ['pdf', 'docx', 'doc'],
        resource_type: 'auto', // Required for non-image files
        type:'upload',
        public_id: `${name}-${Date.now()}`,

          
      };
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
const profilePhotoUpload = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'jobportal/profilePhotos',
      allowed_formats: ['jpg', 'jpeg', 'png'],
      resource_type: 'image',
      public_id: (req, file) => `${path.parse(file.originalname).name}-${Date.now()}`
    }
  }),
  fileFilter: imageFilter,
});

const resumeUpload = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'jobportal/user-resumes',
      allowed_formats: ['pdf', 'docx', 'doc'],
      resource_type: 'auto',
      public_id: (req, file) => `${path.parse(file.originalname).name}-${Date.now()}`
    }
  }),
  fileFilter: resumeFilter,
});

const uploadProfileCloudinary = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const { name :originalnameWithoutExt} = path.parse(file.originalname);
      let folder = '';
      let allowed_formats = [];

      if (file.fieldname === 'resume') {
        folder = 'jobportal/user-resumes';
        allowed_formats = ['pdf', 'docx', 'doc'];
      } else if (file.fieldname === 'profilePhoto') {
        folder = 'jobportal/profilePhotos';
        allowed_formats = ['jpg', 'jpeg', 'png'];
      } else {
        throw new Error('Unexpected field');
      }

      return {
        folder,
        allowed_formats,
        public_id: file.fieldname === 'resume' 
        ? `${Date.now()}_${originalnameWithoutExt}.pdf` // ✅ only for resume
        : `${Date.now()}_${originalnameWithoutExt}`,   
        resource_type: file.fieldname === 'resume' ? 'raw' : 'auto'
      };
    }
  }),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.fieldname === 'resume') {
      if (['.pdf', '.docx', '.doc'].includes(ext)) return cb(null, true);
      return cb(new Error('Invalid resume format'), false);
    } else if (file.fieldname === 'profilePhoto') {
      if (['image/png', 'image/jpg', 'image/jpeg'].includes(file.mimetype)) return cb(null, true);
      return cb(new Error('Invalid image format'), false);
    }
    return cb(new Error('Unexpected field'), false);
  }
});


const uploadProfile = multer({ storage, fileFilter });


const uploadCompanyLogo = multer({ storage: imageStorage, fileFilter: imageFilter });
// const uploadUserResume = multer({ storage: resumeStorage, fileFilter: resumeFilter });
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
  uploadProfileCloudinary,
  uploadProfile,
  clearImage,
  profilePhotoUpload,
  resumeUpload,
  uploadCompanyLogo,
  uploadChatbotResume,
  
};

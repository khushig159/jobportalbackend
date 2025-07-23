const express = require('express');
const router = express.Router();
const authSeeker = require('../middleware/auth-seeker');
const seekerController = require('../controller/seeker');
const multer = require('multer')
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { uploadProfile, uploadCompanyLogo, uploadUserResume, uploadChatbotResume } = require('../middleware/multer');


// Combined storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'resume') cb(null, 'uploads/resumes');
    else if (file.fieldname === 'profilePhoto') cb(null, 'uploads/profilePhotos');
    else cb(new Error('Invalid fieldname'), false);
  },
  filename: (req, file, cb) => {
    const uniqueName = uuidv4() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});

// Combined filter config
const fileFilter = (req, file, cb) => {
  
  if (file.fieldname === 'resume') {
 
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.pdf', '.doc', '.docx'];

    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid resume format'), false);
    }
  } else if (file.fieldname === 'profilePhoto') {
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg'
  ) {
      cb(null, true);
  } else {
      cb(new Error('Only jpg, png, jpeg allowed'), false);
  }
  } else {
    cb(new Error('Unexpected field'), false);
  }
};

const upload = multer({ storage, fileFilter });


router.get('/getjobs', authSeeker, seekerController.getJobs)

router.post('/saveJob/:jobId', authSeeker, seekerController.saveJob)

router.post('/applyjob/:jobId', authSeeker, seekerController.applyJobs)

router.get('/savedJobs',authSeeker,seekerController.getSavedJobs)

router.get('/appliedJobs',authSeeker,seekerController.getAppliedJobs)

router.delete('/unsavejob/:jobId',authSeeker,seekerController.unsavejobs)

router.delete('/deleteApplication/:jobId',authSeeker,seekerController.deleteApplication)


// router.post(
//     '/create-profile',
//     authSeeker,
//     upload.fields([
//         { name: 'resume', maxCount: 1 },
//         { name: 'profilePhoto', maxCount: 1 }
//     ]),
//     seekerController.createProfile
// );
router.post(
  '/create-profile',
  authSeeker,
  (req, res, next) => {
    uploadProfile.single('profilePhoto')(req, res, function (err) {
      if (err) return res.status(400).json({ error: err.message });
      uploadUserResume.single('resume')(req, res, function (err2) {
        if (err2) return res.status(400).json({ error: err2.message });
        next();
      });
    });
  },
  seekerController.createProfile
);


// router.put('/editProfile',authSeeker,
//   upload.fields([
//     { name: 'resume', maxCount: 1 },
//     { name: 'profilePhoto', maxCount: 1 }
//   ]),
//   seekerController.editJobSeekerProfile
// )
router.put(
  '/editProfile',
  authSeeker,
  (req, res, next) => {
    uploadProfile.single('profilePhoto')(req, res, function (err) {
      if (err) return res.status(400).json({ error: err.message });
      uploadUserResume.single('resume')(req, res, function (err2) {
        if (err2) return res.status(400).json({ error: err2.message });
        next();
      });
    });
  },
  seekerController.editJobSeekerProfile
);


router.get('/getprofile',authSeeker,seekerController.getSeekerProfile )

router.get('/getname',authSeeker,seekerController.getName)

router.get('/users',authSeeker,seekerController.getUsers)

router.get('/users/:Id',authSeeker,seekerController.getUserprofile)

router.post('/connect/:userId',authSeeker,seekerController.connectUser)

router.post('/request-pending',authSeeker,seekerController.getPendingRequests)

router.post('/request-accept/:Id',authSeeker,seekerController.AcceptRequest)

router.post('/request-reject/:Id',authSeeker,seekerController.RejectRequest)

router.get('/connections',authSeeker,seekerController.getConnections)

router.get('/getsendrequests',authSeeker,seekerController.getSendRequests)

router.get('/getConnectionrequests',authSeeker,seekerController.getConnectionRequests)

router.post('/unrequest/:userId', authSeeker, seekerController.unrequestUser);

router.post('/remove-connection/:userId', authSeeker, seekerController.removeConnection);


module.exports = router;
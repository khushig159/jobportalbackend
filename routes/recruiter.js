const express = require('express');
const router = express.Router();
const Recruiter = require('../model/recruiter');
const { body } = require('express-validator');
const authRecruiter=require('../middleware/auth-recruiter');
const recruiterController = require('../controller/recruiter')
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { uploadProfile, uploadCompanyLogo, uploadUserResume, uploadChatbotResume } = require('../middleware/multer');


const companylogoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/CompanyLogo');
    },
    filename: (req, file, cb) => {
        cb(null, uuidv4() + '-' + file.originalname);
    }
});

const CompanyLogoFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        cb(null, true);
    } else {
        cb(new Error('Only jpg, png, jpeg allowed'), false);
    }
};

// const uploadCompanyLogo = multer({ storage: companylogoStorage, fileFilter: CompanyLogoFilter });

router.post('/profile', authRecruiter, uploadCompanyLogo.single('companyLogo'), recruiterController.postrecruiterProfile);

router.get('/getprofile', authRecruiter, recruiterController.getRecruiterProfile)

router.put('/editprofile', authRecruiter, uploadCompanyLogo.single('companyLogo'),recruiterController.editRecruiterProfile)


router.post(
    '/postjob',
    authRecruiter,
    [
        body('jobTitle').notEmpty().withMessage('Job title is required'),
        body('industry').notEmpty().withMessage('Industry is required'),
        body('jobDescription').notEmpty().withMessage('Job description is required'),
        body('requirements').notEmpty().withMessage('Requirements are required'),
        body('jobType').notEmpty().withMessage('Job type is required'),
        body('location').notEmpty().withMessage('Location is required'),
        body('salaryRange').notEmpty().withMessage('Salary range is required'),
        body('experienceLevel').notEmpty().withMessage('Experience level is required'),
        
    ],
    recruiterController.postJobs
);

router.get('/postedjobs', authRecruiter, recruiterController.getPostedJobs);

router.put('/editjob/:jobId', authRecruiter, [
    body('jobTitle').notEmpty().withMessage('Job title is required'),
    body('industry').notEmpty().withMessage('Industry is required'),
    body('jobDescription').notEmpty().withMessage('Job description is required'),
    body('requirements').notEmpty().withMessage('Requirements are required'),
    body('jobType').notEmpty().withMessage('Job type is required'),
    body('location').notEmpty().withMessage('Location is required'),
    body('salaryRange').notEmpty().withMessage('Salary range is required'),
    body('experienceLevel').notEmpty().withMessage('Experience level is required')
],recruiterController.editJob);

router.delete('/deletejob/:jobId', authRecruiter, recruiterController.deleteJob);

router.get('/getApplications/:jobId',authRecruiter,recruiterController.getApplications)

router.post('/updateStatus/:jobId/:applicantId',authRecruiter,recruiterController.updateApplicationStatus)

router.get('/getAllApplication',authRecruiter,recruiterController.getAllApplicants)

router.get('/getAllCandidates',recruiterController.getAllCandidates)

module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {body} = require('express-validator');
const authController = require('../controller/auth');
const authRecruiterController=require('../controller/auth-recruiter')
const authseeker=require('../middleware/auth-seeker')
const authrecruiter=require('../middleware/auth-recruiter')

router.post('/signup-seeker', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('phone').isMobilePhone().withMessage('Please enter a valid phone number')
], authController.signupSeeker);

router.post('/login-seeker', [
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], authController.loginSeeker);

router.post('/logout-seeker', authseeker,authController.logoutSeeker);

router.post('/signuprecruiter', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
], authRecruiterController.signupRecruiter);

router.post('/login-recruiter', [
    body('email').isEmail().withMessage('Please enter a valid email address'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], authRecruiterController.loginRecruiter);

router.post('/logout-recruiter', authrecruiter,authRecruiterController.logoutRecruiter);

router.get('/verify-email', authController.verifyEmailSeeker);

router.get('/verify-emailrec', authRecruiterController.verifyEmailRecruiter);

router.post('/request-reset-password', authController.requestResetPassword);

router.get('/verify-reset-token/:token', authController.verifyResetToken);

router.post('/reset-password', authController.resetPassword);

router.post('/request-reset-passwordrec', authRecruiterController.requestResetPassword);

router.get('/verify-reset-tokenrec/:token', authRecruiterController.verifyResetToken);

router.post('/reset-passwordrec', authRecruiterController.resetPassword);

module.exports = router;
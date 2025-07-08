const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const JobSeeker = require('../model/seeker.js');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const { sendLoginEmail, sendVerificationEmail, sendResetEmail } = require('../utils/mailer.js')


exports.signupSeeker = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error("Validation failed, entered data is incorrect");
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }

        const existingUser = await JobSeeker.findOne({ email: req.body.email });
        if (existingUser) {
            const error = new Error("Email already exists, please use a different email");
            error.statusCode = 422;
            throw error;
        }

        const { name, email, password, phone } = req.body;
        const hashedPassword = await bcrypt.hash(password, 12);

        const jobSeeker = new JobSeeker({
            name,
            email,
            password: hashedPassword,
            phone,
            isVerified: false
        });

        const savedUser = await jobSeeker.save();

        const token = jwt.sign(
            { userId: savedUser._id },
            process.env.EMAIL_VERIFICATION_SECRET,
            { expiresIn: process.env.EMAIL_VERIFICATION_SECRET_TOKEN_EXPIRY }
        );

        const verifyUrl = `${process.env.CLIENT_URL}/email-verify?token=${token}`;

        await sendVerificationEmail(savedUser.email, savedUser.name, verifyUrl);

        setTimeout(async () => {
            try {
                const staleUser = await JobSeeker.findById(savedUser._id).lean();
                if (staleUser && !staleUser.isVerified) {
                    await JobSeeker.findByIdAndDelete(savedUser._id);
                    console.log(`Deleted unverified user: ${staleUser.email}`);
                }
            } catch (cleanupErr) {
                console.error('Error deleting unverified user:', cleanupErr);
            }
        }, 60 * 60 * 1000);

        res.status(201).json({
            message: 'User created. Please verify your email.',
            userId: savedUser._id
        });


    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.verifyEmailSeeker = async (req, res, next) => {
    const { token } = req.query;
    try {
        const decoded = jwt.verify(token, 'emailSecretKey');
        const user = await JobSeeker.findById(decoded.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isVerified = true;
        await user.save();

        res.status(200).json({ message: 'Email verified successfully' });
    } catch (err) {
        res.status(400).json({ message: 'Invalid or expired token' });
    }
};


exports.loginSeeker = async (req, res, next) => {
    const options = {
        httpOnly: false,
        secure: true,
        sameSite: "None",
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    };

    const refreshOptions = {
        httpOnly: false,
        secure: true,
        sameSite: "None",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    try {
        const { email, password } = req.body;



        const user = await JobSeeker.findOne({ email });
        if (!user) {
            const error = new Error("A user with this email could not be found.");
            error.statusCode = 403;
            throw error;
        }
        if (!user.isVerified) {
            const error = new Error("Please verify your email before logging in.");
            error.statusCode = 400;
            throw error;
        }

        const isEqual = await bcrypt.compare(password, user.password);
        if (!isEqual) {
            const error = new Error("Wrong password!");
            error.statusCode = 401;
            throw error;
        }

        const accessToken = jwt.sign(
            {
                email: user.email,
                userId: user._id.toString()
            },
            process.env.ACCESS_TOKEN_USER,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
        );

        const refreshToken = jwt.sign(
            {
                userId: user._id.toString(),
                jti: uuidv4(),

            },
            process.env.REFRESH_TOKEN_USER,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRY  }
        );
        user.refreshToken = refreshToken;
        await user.save();
        res
            .status(200)
            .cookie('useraccessToken', accessToken, options)
            .cookie('userrefreshToken', refreshToken, refreshOptions)
            .json({
                message: 'User logged in successfully',
                userId: user._id.toString(),
                refreshToken,
                accessToken
            });
        await sendLoginEmail(user.email, user.name)

    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.logoutSeeker = async (req, res, next) => {
    try {
        const userId = req.userId;
        const user = await JobSeeker.findById(userId);
        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }
        user.refreshToken = null;
        await user.save();
        const options = {
            httpOnly: false,
            secure: true,
            sameSite: "None",
            maxAge: 24 * 60 * 60 * 1000
        }

        return res
            .status(200)
            .clearCookie("useraccessToken", options)
            .clearCookie("userrefreshToken", options)
            .json({ message: "User logged out" });
    } catch (error) {
        return res.status(500).json({ message: "Error in logging out" });

    }
}
exports.requestResetPassword = async (req, res, next) => {
    try {
        const buffer = crypto.randomBytes(32);
        const token = buffer.toString('hex');

        const user = await JobSeeker.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({ message: 'No account with that email found.' });
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetUrl = `${process.env.CLIENT_URL}/reset-paasword/${token}`;

        await sendResetEmail(user.email, user.name, resetUrl)

        res.status(200).json({ message: 'Password reset link sent!' });
    } catch (err) {
        next(err);
    }
};

exports.verifyResetToken=async(req,res,next)=>{
    try{
        const token=req.params.token;
        const user=await JobSeeker.findOne({
            resetToken:token,
            resetTokenExpiration: { $gt: Date.now() }
        })

        if(!user){
            return res.status(400).json({ message: 'Invalid or expired token' });
        }
        res.status(200).json({ message: 'Valid token', userId: user._id, token });
    } catch (err) {
      next(err);
    }
  };

exports.resetPassword=async(req,res,next)=>{
    try{
        const{password,userId,token}=req.body;
        const user=await JobSeeker.findOne({
            _id:userId,
            resetToken: token,
            resetTokenExpiration: { $gt: Date.now() }
        });
        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }
        const hashedPassword=await bcrypt.hash(password,12);
        user.password=hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiration = undefined;
    
        await user.save();
        res.status(200).json({ message: 'Password updated successfully!' });
      } catch (err) {
        next(err);
      }
    };


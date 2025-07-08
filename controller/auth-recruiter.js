const Recruiter = require("../model/recruiter");
const { validationResult } = require("express-validator");
// const JobSeeker = require("../model/seeker");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto=require('crypto')
const { sendLoginEmailRec, sendVerificationEmail ,sendResetEmail} = require('../utils/mailer')

const generateAccessandRefreshToken = async (userId) => {
    try {
        const user = await Recruiter.findById(userId);
        const accesstoken = await user.createAccessToken();
        const refreshtoken = await user.createRefreshToken();

        user.refreshTokenrecruiter = refreshtoken;
        user.markModified('refreshTokenrecruiter');

        // console.log("Before saving refreshToken:", user.refreshTokenrecruiter);
        await user.save();
        // console.log("Saved recruiter:", user);

        return { accesstoken, refreshtoken }
    } catch (error) {
        res.status(500).json({ message: "Error in generating tokens" });
    }
};

exports.signupRecruiter = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const error = new Error("Validation failed, entered data is incorrect");
            error.statusCode = 422;
            error.data = errors.array();
            throw error;
        }

        const existingUser = await Recruiter.findOne({ email: req.body.email });
        if (existingUser) {
            const error = new Error("Email already exists, please use a different email");
            error.statusCode = 422;
            throw error;
        }

        const { name, email, password, companyLocation, companysize, industry } = req.body;
        const hashedPassword = await bcrypt.hash(password, 12);

        const recruiter = new Recruiter({
            name,
            email,
            password: hashedPassword,
            companyLocation,
            companysize,
            industry,
            isVerified: false
        });

        const savedUser = await recruiter.save();

        const token = jwt.sign(
            { userId: savedUser._id },
            process.env.EMAIL_VERIFICATION_SECRET,
            { expiresIn: process.env.EMAIL_VERIFICATION_SECRET_TOKEN_EXPIRY }
        );

        const verifyUrl = `${process.env.CLIENT_URL}/email-verifyrec?token=${token}`;

        await sendVerificationEmail(savedUser.email, savedUser.name, verifyUrl);

        setTimeout(async () => {
            try {
                const staleUser = await Recruiter.findById(savedUser._id).lean();
                if (staleUser && !staleUser.isVerified) {
                    await Recruiter.findByIdAndDelete(savedUser._id);
                    console.log(`Deleted unverified user: ${staleUser.email}`);
                }
            } catch (cleanupErr) {
                console.error('Error deleting unverified user:', cleanupErr);
            }
        }, 60 * 60 * 1000);

        const createdUser = await Recruiter.findById(savedUser._id).select(
            "-password -refreshTokenrecruiter"
        );
        if (!createdUser) {
            return res.status(500).json({ message: "Error in creating user" });
        }

        res.status(201).json({
            message: 'User created. Please verify your email.',
            userId: createdUser._id,
            user: createdUser  // if you want more info in frontend
        });


    } catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
};

exports.verifyEmailRecruiter = async (req, res, next) => {
    const { token } = req.query;
    try {
        const decoded = jwt.verify(token, 'emailSecretKey');
        const user = await Recruiter.findById(decoded.userId);
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

exports.loginRecruiter = async (req, res, next) => {
    const options = {
        httpOnly: false,
        secure: true,
        sameSite: "None",
        maxAge: 24 * 60 * 60 * 1000
    };
    try {

        const { email, password } = req.body;

        const recruiter = await Recruiter.findOne({ email });
        if (!recruiter) {
            const error = new Error("A user with this email could not be found.");
            error.statusCode = 403;
            throw error;
        }

        if (!recruiter.isVerified) {
            const error = new Error("Please verify your email before logging in.");
            error.statusCode = 400;
            throw error;
        }


        const isEqual = await bcrypt.compare(password, recruiter.password);
        if (!isEqual) {
            const error = new Error("Wrong password!");
            error.statusCode = 401;
            throw error;
        }
        const { accesstoken, refreshtoken } = await generateAccessandRefreshToken(recruiter._id);

        // console.log("After save:", recruiter);
        const loggedInUser = await Recruiter.findById(recruiter._id).select("-password -refreshTokenrecruiter");
        // console.log("Logged in user:", loggedInUser);

        await sendLoginEmailRec(recruiter.email, recruiter.name);

        return res
            .status(200)
            .cookie('accessToken', accesstoken, options)
            .cookie('refreshToken', refreshtoken, options)
            .json({
                message: 'User logged in successfully',
                user: loggedInUser,
                userId: loggedInUser._id,
                accesstoken,
                refreshtoken
            });
    } catch (err) {
        next(err);
    }
};

exports.logoutRecruiter = async (req, res, next) => {
    try {
        const userId = req.recruiteruserId;
        const user = await Recruiter.findById(userId);
        if (!user) {
            const error = new Error("User not found");
            error.statusCode = 404;
            throw error;
        }
        user.refreshTokenrecruiter = null;
        await user.save();
        const options = {
            httpOnly: false,
            secure: true,
            sameSite: "None",
            maxAge: 24 * 60 * 60 * 1000
        }

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json({ message: "User logged out" });
    } catch (error) {
        return res.status(500).json({ message: "Error in logging out" });

    }
}
exports.requestResetPassword = async (req, res, next) => {
    try {
        const buffer = crypto.randomBytes(32);
        const token = buffer.toString('hex');

        const user = await Recruiter.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({ message: 'No account with that email found.' });
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetUrl = `${process.env.CLIENT_URL}/reset-paasword2/${token}`;

        await sendResetEmail(user.email, user.name, resetUrl)

        res.status(200).json({ message: 'Password reset link sent!' });
    } catch (err) {
        next(err);
    }
};

exports.verifyResetToken=async(req,res,next)=>{
    try{
        const token=req.params.token;
        const user=await Recruiter.findOne({
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
        const user=await Recruiter.findOne({
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



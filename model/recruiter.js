const mongoose = require("mongoose");
const { Schema } = mongoose;
const jwt=require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid'); // <-- Add this at the top

const recruiterSchema = new Schema({
  // Personal Info
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed
  refreshTokenrecruiter: {
    type: String,
  },
  // Company Info
  companyWebsite: String,
  companyLocation: String,
  companyDescription: String,
  companysize: String,
  industry: String, // e.g., IT, Finance, Healthcare
  linkedIn: String,
  companyLogo: String, // URL or path to the logo image
  // Job Postings
  postedJobs: [{ type: Schema.Types.ObjectId, ref: "Job" }],
  isVerified: {
    type: Boolean,
    default: false
  },
  resetToken: { type: String },
resetTokenExpiration: { type: Date },

  
  // Applications to their jobs
  applications: [
    {
      job: { type: Schema.Types.ObjectId, ref: "Job", required: true },
      applicant: { type: Schema.Types.ObjectId, ref: "JobSeeker", required: true },
      resumeUrl: String,
      applicationDate: { type: Date, default: Date.now },
      status: {
        type: String,
        enum: ["Applied", "Rejected", "Accepted"],
        default: "Applied",
      },
      note: String, // Optional notes from recruiter
    }
  ],

}, { timestamps: true });

recruiterSchema.methods.createAccessToken=async function(){
  return jwt.sign(
          {
                  email:this.email,
                  _id:this._id,

          },
          process.env.ACCESS_TOKEN,
          {expiresIn:process.env.ACCESS_TOKEN_EXPIRY}
  );
}

recruiterSchema.methods.createRefreshToken=async function(){
  return jwt.sign(
          {
                  _id:this._id,
                  jti: uuidv4(), // 👈 unique token ID to ensure refreshToken is always different
          },
          process.env.REFRESH_TOKEN,
          {expiresIn: process.env.REFRESH_TOKEN_EXPIRY}
  );
}

module.exports = mongoose.model('Recruiter', recruiterSchema);
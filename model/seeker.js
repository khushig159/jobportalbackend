// models/JobSeeker.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const experienceSchema = new Schema({
  title: String,
  company: String,
  from: Date,
  to: Date,
  responsibilities: String
});

const socialExperienceSchema = new Schema({
  role: String,
  company: String,
  from: Date,
  to: Date,
  responsibilities: String
});

// const internshipExperienceSchema = new mongoose.Schema({
//     role: String,
//     company: String,
//     from: Date,
//     to: Date,
//     responsibilities: String
//   });

const jobSeekerSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed, ideally

  // Optional personal info
  dob: Date,
  location: String,
  currentProfession: String,
  about: String,

  // Education
  qualification: String,
  course: String,
  college: String,
  cgpa: Number,
  graduationYear: Number,

  tenthSchool: String,
  tenthPercent: Number,
  tenthPassout: Number,

  twelveSchool: String,
  twelfthPercent: Number,
  twelvePassout: Number,

  // Experiences
  jobExperiences: [experienceSchema],
  internExperiences: [experienceSchema],
  socialExperiences: [socialExperienceSchema],

  skills: [String], // Array of skill strings


  // Links
  linkedin: String,
  github: String,

  isVerified: {
    type: Boolean,
    default: false
  },
  resetToken: { type: String },
resetTokenExpiration: { type: Date },

// models/User.js
connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'JobSeeker' }],
sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'JobSeeker' }],
connectionRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'JobSeeker' }],



  // Resume
  resumeUrl: {
    type: String,
    default: ""
  },
  profilephoto: {
    type: String,
    default: ""
  },

  refreshToken: { type: String },

  appliedJobs: [
    {
    job: { type: Schema.Types.ObjectId, ref: "Jobs" },
     appliedAt: { type: Date, default: Date.now },
    }
  ],
  savedJobs: [{ type: Schema.Types.ObjectId, ref: "Jobs" }],
}, { timestamps: true });

module.exports = mongoose.model('JobSeeker', jobSeekerSchema);

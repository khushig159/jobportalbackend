const mongoose= require('mongoose');
// const { Schema } = mongoose;

const jobPostSchema = new mongoose.Schema({
  jobTitle: {
    type: String,
    required: true,
    trim: true,
  },
  industry: {
    type: String,
    required: true,
    trim: true,
  },
  jobDescription: {
    type: String,
    required: true,
  },
  requirements: {
    type: String,
    required: true,
  },
  jobType: {
    type: String, // Full-time, Part-time, Internship, etc.
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  salaryRange: {
    type: String, // or use { min: Number, max: Number } if you want structured data
    required: true,
  },
  experienceLevel: {
    type: String, // Fresher, 1-3 years, etc.
    required: true,
  },
  applicationDeadline: {
    type: Date,
    required: true,
  },
 place:{
  type: String,
  required: true,
 },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Recruiter", // assuming a Recruiter model exists
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Job', jobPostSchema);

 
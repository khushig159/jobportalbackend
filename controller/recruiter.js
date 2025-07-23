const express = require('express');
const Recruiter = require('../model/recruiter');
const Job = require('../model/jobs');
const { validationResult } = require('express-validator');
const fs = require('fs')
const path = require('path')
const JobSeeker=require('../model/seeker')
const {clearImage}=require('../middleware/multer')

exports.postJobs = async (req, res, next) => {
    try {
        const { jobTitle, industry, place,jobDescription, requirements, jobType, location, salaryRange, experienceLevel, applicationDeadline } = req.body;
        const recruiterId = req.recruiteruserId;
        if (!recruiterId) {
            return res.status(403).json({ message: "You are not authorized to post a job, please login as a recruiter" });
        }
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ message: "Validation failed", errors: errors.array() });
        }
        const job = new Job({
            jobTitle,
            industry,
            jobDescription,
            requirements,
            jobType,
            location,
            salaryRange,
            experienceLevel,
            applicationDeadline,
            place,
            postedBy: recruiterId
        });

        const result = await job.save();
        const recruiter = await Recruiter.findById(recruiterId)
        recruiter.postedJobs.push(result);
        await recruiter.save();
        res.status(201).json({
            message: 'Job posted successfully',
            jobId: result._id,
            job: result,
            recruiter: {
                id: recruiter._id,
                name: recruiter.name,
                email: recruiter.email
            }
        });
    }
    catch (error) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(error);
    }
}

exports.getPostedJobs = (req, res, next) => {
    const recruiterId = req.recruiteruserId;
    if (!recruiterId) {
        return res.status(403).json({ message: "You are not authorized to view posted jobs, please login as a recruiter" });
    }
    Job.find({ postedBy: recruiterId })
        .populate('postedBy')
        .then(jobs => {
            if (!jobs || jobs.length === 0) {
                return res.status(404).json({ message: "No jobs found for this recruiter" });
            }
            res.status(200).json({
                message: 'Jobs fetched successfully',
                jobs: jobs
            });
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err);
        });
}

exports.editJob = async (req, res, next) => {
    const jobId = req.params.jobId;
    // console.log("Job ID:", jobId);
    const recruiterId = req.recruiteruserId;

    if (!recruiterId) {
        return res.status(403).json({ message: "You are not authorized to edit this job, please login as a recruiter" });
    }

    try {
        const job = await Job.findById(jobId);
        // console.log("Job found:", job);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }
        if (job.postedBy.toString() !== recruiterId.toString()) {
            return res.status(403).json({ message: "You are not authorized to edit this job" });
        }
        const { jobTitle, place,industry, jobDescription, requirements, jobType, location, salaryRange, experienceLevel, applicationDeadline } = req.body;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ message: "Validation failed", errors: errors.array() });
        }
        job.jobTitle = jobTitle;
        job.place=place;
        job.industry = industry;
        job.jobDescription = jobDescription;
        job.requirements = requirements;
        job.jobType = jobType;
        job.location = location;
        job.salaryRange = salaryRange;
        job.experienceLevel = experienceLevel;
        job.applicationDeadline = new Date(applicationDeadline);
        const updatedJob = await job.save();
        res.status(200).json({
            message: 'Job updated successfully',
            job: updatedJob
        });
    }
    catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.deleteJob = async (req, res, next) => {
    const jobId = req.params.jobId;
    const recruiterId = req.recruiteruserId;
    if (!recruiterId) {
        return res.status(403).json({ message: "You are not authorized to delete this job, please login as a recruiter" });
    }
    try {
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ message: "Job not found" });
        }
        if (job.postedBy.toString() !== recruiterId.toString()) {
            return res.status(403).json({ message: "You are not authorized to delete this job" });
        }
        await Job.findByIdAndDelete(jobId);
        const recruiter = await Recruiter.findById(recruiterId);
        recruiter.postedJobs.pull(jobId);
        await recruiter.save();
        res.status(200).json({
            message: 'Job deleted successfully',
            jobId: jobId
        });
    }
    catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.postrecruiterProfile = async (req, res, next) => {
    const recruiterId = req.recruiteruserId;
    if (!recruiterId) {
        return res.status(403).json({ message: "You are not authorized to post a profile, please login as a recruiter" });
    }
    try {
        const { companyWebsite, companyDescription, linkedIn } = req.body;
        const companyLogoPath = req.file.path.replace("\\", "/");
        // const errors = validationResult(req);
        // if (!errors.isEmpty()) {``
        //     return res.status(422).json({ message: "Validation failed", errors: errors.array() });
        // }
        const recruiter = await Recruiter.findById(recruiterId);
        if (!recruiter) {
            return res.status(404).json({ message: "Recruiter not found" });
        }
        recruiter.companyWebsite = companyWebsite;
        recruiter.companyDescription = companyDescription;
        recruiter.linkedIn = linkedIn;
        recruiter.companyLogo = companyLogoPath;

        const updatedRecruiter = await recruiter.save();
        res.status(200).json({
            message: 'Recruiter profile updated successfully',
            recruiter: updatedRecruiter
        });
    }
    catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        next(error);
    }
}

exports.getRecruiterProfile = async (req, res, next) => {
    const recruiterId = req.recruiteruserId
    try {
        const recruiter = await Recruiter.findById(recruiterId)
        if (!recruiter) {
            res.status(404).json({
                message: 'You need to login before accessing your profile'
            })
        }
        res.status(200).json({
            recruiter, message: 'Profile fetched successfully'
        })
    }
    catch (err) {
        res.status(500).json({ message: "Error fetching recruiter profile", error: err.message });
    }
}

// const clearImage = filePath => {
//     filePath = path.join(__dirname, '..', filePath);
//     fs.unlink(filePath, err => {
//         console.log(err);
//     })
// }

exports.editRecruiterProfile = async (req, res, next) => {
    const recruiterId = req.recruiteruserId


    const { companyWebsite, linkedIn, companyDescription, companyLocation, companysize, industry, name } = req.body;
    // let companyLogoPath = req.body.companyLogo
    // if (req.file) {
    //     companyLogoPath = req.file?.path.replace("\\", "/");
    // }

    try {
        const recruiter = await Recruiter.findById(recruiterId)
        if (!recruiter) {
            return res.status(404).json({ message: "Recruiter not found, Login to continue" });
        }
        if (req.file) {
            const newLogoPath = req.file?.path || req.file?.secure_url || req.file?.url;

            // Delete previous logo if different
            if (recruiter.companyLogo && recruiter.companyLogo !== newLogoPath) {
                clearImage(recruiter.companyLogo);
            }

            recruiter.companyLogo = newLogoPath;
        }

        recruiter.companyWebsite = companyWebsite || recruiter.companyWebsite;
        recruiter.name = name || recruiter.name;
        recruiter.industry = industry || recruiter.industry;
        recruiter.companysize = companysize || recruiter.companysize;
        recruiter.linkedIn = linkedIn || recruiter.linkedIn;
        recruiter.companyDescription = companyDescription || recruiter.companyDescription;
        recruiter.companyLocation = companyLocation || recruiter.companyLocation;

        const result = await recruiter.save();
        res.status(200).json({ message: 'Recruiter Details updated successfully', recruiter: result })

    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    }
}
exports.getApplications = async (req, res, next) => {
    const jobId = req.params.jobId;
    try {
        const recruiterId = req.recruiteruserId;
        const recruiter = await Recruiter.findById(recruiterId)
        if (!recruiter) {
            console.log("Recruiter ID not found in request.");
            return res.status(404).json({ message: "Recruiter not found, Login to continue" });
        }
        const matchingApplications = recruiter.applications.filter(
            app => app.job.toString() === jobId.toString()
        );
        // const applicantIds = matchingApplications.map(app => app.applicant);

        // const users = await JobSeeker.find({ _id: { $in: applicantIds } });

        const enrichedApplicants = await Promise.all(
            matchingApplications.map(async (app) => {
                const user = await JobSeeker.findById(app.applicant);
                return {
                    applicant: user,
                    applicationDate: app.applicationDate,
                    status: app.status,
                };
            })
        );
        res.status(200).json({ applicants: enrichedApplicants, message: 'applicants fetched successfully' })
    }
    catch (err) {
        res.status(500).json({ message: 'Error fetching applicants', error: err.message });
    }
}

exports.getAllApplicants = async (req, res, next) => {
    const recruiterId = req.recruiteruserId;
  
    try {
      const recruiter = await Recruiter.findById(recruiterId);
  
      if (!recruiter) {
        return res.status(401).json({ message: 'You are not logged in to continue' });
      }
  
      const applications = recruiter.applications;
  
      if (!applications || applications.length === 0) {
        return res.status(200).json({ message: 'No applications found', applications: [] });
      }
  
      // Collect all applicant and job IDs
      const applicantIds = applications.map(app => app.applicant);
      const jobIds = applications.map(app => app.job);
  
      // Fetch applicants and jobs in bulk
      const applicants = await JobSeeker.find({ _id: { $in: applicantIds } });
      const jobs = await Job.find({ _id: { $in: jobIds } });
  
      // Create quick lookup maps
      const applicantMap = new Map(applicants.map(user => [user._id.toString(),{ name:user.name, profilePhoto: user.profilephoto || 'uploads/default-profile.png' , skills:user.skills, prof:user.currentProfession, loc:user.location }    ]));
    //   const applicantMapM = new Map(applicants.map(user => [user._id.toString(), user.name]));
      const jobMap = new Map(jobs.map(job => [job._id.toString(), job.jobTitle]));
  
      // Combine everything into a response
      const applicationDetails = applications.map(app => {
        const applicant=applicantMap.get(app.applicant.toString())||{}
        return{
            applicantName: applicant.name || 'Unknown',
            applicantCurrentprof: applicant.prof || 'Unknown',
            applicantskills: applicant.skills || 'Unknown',
            applicantlocation: applicant.loc || 'Unknown',
            applicantProfile: applicant.profilePhoto || 'uploads/default-profile.png',
            jobTitle: jobMap.get(app.job.toString()) || 'Unknown',
            applicationDate: app.applicationDate,
            status: app.status,
            resumeUrl: app.resumeUrl,
            appliedAt:app.applicationDate
      }});
  
      res.status(200).json({
        message: 'Applications fetched successfully',
        applications: applicationDetails
      });
  
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: 'Error fetching applicants',
        error: err.message
      });
    }
  };
  

exports.updateApplicationStatus = async (req, res, next) => {
    const { jobId, applicantId } = req.params;
    const { status } = req.body; // New status sent from frontend

    try {
        const recruiterId = req.recruiteruserId;
        const recruiter = await Recruiter.findById(recruiterId);

        if (!recruiter) {
            return res.status(404).json({ message: "Recruiter not found, Login to continue" });
        }

        // Find the matching application
        const application = recruiter.applications.find(
            (app) =>
                app.job.toString() === jobId.toString() &&
                app.applicant.toString() === applicantId.toString()
        );

        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        // Update the status
        application.status = status;

        // Save the updated recruiter
        await recruiter.save();

        res.status(200).json({ message: "Application status updated successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error updating status", error: err.message });
    }
};
exports.getAllCandidates=async(req,res,next)=>{
    try{
        const user=await JobSeeker.find();
        res.status(200).json({user,message:'Fetched Candidates'})
    }
    catch(err){
        res.status(500).json({ message: "Error fetching Candidates", error: err.message });
    }
}
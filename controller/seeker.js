const Job = require('../model/jobs');
const JobSeeker = require('../model/seeker')
const { validationResult } = require('express-validator');
const Recruiter = require('../model/recruiter')
const fs = require('fs')
const path = require('path')
const {clearImage}=require('../middleware/multer')
const { v2: cloudinary } = require('cloudinary');
const {streamifier}=require('streamifier')

exports.getJobs = async (req, res, next) => {
    try {
        const jobs = await Job.find().populate('postedBy')
        res.status(200).json({
            message: 'jobs fetched successfully',
            jobs: jobs,
        })
    }
    catch (err) {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err);
    };
}

exports.saveJob = async (req, res, next) => {
    const jobId = req.params.jobId;
    const userId = req.userId;
    try {
        const job = await Job.findById(jobId)
        if (!job) {
            res.status(401).json({ message: 'Job not found' })
        }
        const user = await JobSeeker.findById(userId)
        if (!user) {
            res.status(404).json({ message: 'User not found, Login to continue' })
        }
        if (!user.savedJobs.includes(jobId)) {
            user.savedJobs.push(jobId)
            await user.save()
        }
        res.json({ message: "Job saved successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to save job" });
    }
}

exports.applyJobs = async (req, res, next) => {
    const jobId = req.params.jobId;
    const userId = req.userId;
    try {
        const job = await Job.findById(jobId)
        const seeker = await JobSeeker.findById(userId)
        if (!seeker) {
            res.status(404).json({ message: 'User not found, Login to continue' })
        }
        const alreadyApplied = seeker.appliedJobs.find(j => j.job.toString() === jobId.toString());
        if (alreadyApplied) {
            return res.status(400).json({ error: "Already applied to this job" });
        }
        seeker.appliedJobs.push({ job: jobId });
        await seeker.save();

        const recruiter = await Recruiter.findById(job.postedBy)
        recruiter.applications.push({
            job: jobId,
            applicant: userId,
            resumeUrl: seeker.resumeUrl,
        })
        await recruiter.save();
        res.json({ message: "Job application submitted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error applying to job" });
    }
}


exports.getSeekerProfile = async (req, res, next) => {
    const SeekerId = req.userId
    try {
        const seeker = await JobSeeker.findById(SeekerId)
        if (!seeker) {
            res.status(404).json({
                message: 'You need to login before accessing your profile'
            })
        }
        res.status(200).json({
            seeker, message: 'Profile fetched successfully'
        })
    }
    catch (err) {
        res.status(500).json({ message: "Error fetching recruiter profile", error: err.message });
    }
}

exports.getSavedJobs = async (req, res, next) => {
    try {
        const userId = req.userId;
        const user = await JobSeeker.findById(userId)
        if (!user) {
            res.status(404).json({ message: 'Login to continue' })
        }
        const savedJobsIds = user.savedJobs;
        const Jobs = await Job.find({ _id: { $in: savedJobsIds } }).populate('postedBy')
        res.status(200).json({ jobs: Jobs, message: 'Jobs fetched successfully' })
    }
    catch (err) {
        res.status(500).json({ message: "Error fetching saved jobs", error: err.message });
    }
}

exports.getAppliedJobs = async (req, res, next) => {
    try {
        const userId = req.userId;
        const user = await JobSeeker.findById(userId)
        if (!user) {
            res.status(404).json({ message: 'Login to continue' })
        }
        const appliedJobsIds = user.appliedJobs.map(jobObj => jobObj.job);
        const Jobs = await Job.find({ _id: { $in: appliedJobsIds } }).populate('postedBy')
        res.status(200).json({ jobs: Jobs, message: 'Jobs fetched successfully' })
    }
    catch (err) {
        res.status(500).json({ message: "Error fetching applied jobs", error: err.message });
    }
}

exports.unsavejobs = async (req, res, next) => {
    const jobId = req.params.jobId
    try {
        const userId = req.userId;
        const user = await JobSeeker.findById(userId)
        if (!user) {
            res.status(404).json({ message: 'Login to continue' })
        }
        // user.savedJobs = user.savedJobs.filter(savedId => savedId.toString() != jobId.toString())
        user.savedJobs.pull(jobId)
        await user.save()
        res.status(200).json({ message: 'Job removed from saved jobs successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error unsaving job', error: err.message });
    }
}

exports.deleteApplication = async (req, res, next) => {
    const jobId = req.params.jobId
    try {
        const userId = req.userId;
        const user = await JobSeeker.findById(userId)
        if (!user) {
            res.status(404).json({ message: 'Login to continue' })
        }
        const job = await Job.findById(jobId)
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // user.appliedJobs=user.appliedJobs.filter(jobObj=> jobObj.job.toString() !== jobId.toString());
        user.appliedJobs.pull({ job: jobId })
        await user.save()

        const recruiter = await Recruiter.findById(job.postedBy)
        if (!recruiter) {
            return res.status(404).json({ message: 'Recruiter not found' });
        }

        recruiter.applications = recruiter.applications.filter(app => {
            return !(app.job.toString() === jobId.toString() && app.applicant.toString() === userId.toString());
        });
        await recruiter.save();
        res.status(200).json({ message: 'Application deleted successfully' });
    }
    catch (err) {
        res.status(500).json({ message: 'Error deleting application', error: err.message });
    }
}

// const clearImage = (filePath) => {
//     const fullPath = path.join(__dirname, '..', filePath);
//     fs.unlink(fullPath, (err) => {
//         if (err) {
//             console.log("Failed to delete file:", filePath, err);
//         }
//     });
// };
exports.createProfile = async (req, res, next) => {
    try {
        const userId = req.userId;
        const seeker = await JobSeeker.findById(userId)
        if (!seeker) {
            return res.status(404).json({ message: 'Please login to view your profile' })
        }
        const jobExperiences = JSON.parse(req.body.jobExperiences || "[]");
        const internExperiences = JSON.parse(req.body.internExperiences || "[]");
        const socialExperiences = JSON.parse(req.body.socialExperiences || "[]");
        const skills = JSON.parse(req.body.skills || "[]");
        // const resumePath = req.file.path.replace(/\\/g, "/").replace(/^\/+/, "");
        // const profilephotopath = req.file.path.replace(/\\/g, "/").replace(/^\/+/, "");
        // console.log("User ID:", req.userId);
        // console.log("User from DB:", seeker);
        // console.log("Files:", req.files);

        let resumePath = '';
        let profilephotopath = '';

        

        if (req.files?.resume?.[0]) {
            const resumeRelativePath = req.files.resume[0].path.replace(/\\/g, "/").split("uploads/")[1];
            seeker.resumeUrl = `uploads/${resumeRelativePath}`;
        }
        
        if (req.files?.profilePhoto?.[0]) {
            const profileRelativePath = req.files.profilePhoto[0].path.replace(/\\/g, "/").split("uploads/")[1];
            seeker.profilephoto = `uploads/${profileRelativePath}`;
        }

        const {
            dob, location, currentProfession, about,
            qualification, course, college, cgpa, graduationYear,
            tenthSchool, tenthPercent, tenthPassout,
            twelveSchool, twelfthPercent, twelvePassout,
            linkedin, github
        } = req.body;

        // console.log(profilephotopath)
        // console.log(resumePath)

        seeker.dob = dob;
        seeker.location = location;
        seeker.currentProfession = currentProfession;
        seeker.about = about;
        seeker.qualification = qualification;
        seeker.course = course;
        seeker.college = college;
        seeker.cgpa = cgpa;
        seeker.graduationYear = graduationYear;
        seeker.tenthSchool = tenthSchool;
        seeker.tenthPercent = tenthPercent;
        seeker.tenthPassout = tenthPassout;
        seeker.twelveSchool = twelveSchool;
        seeker.twelfthPercent = twelfthPercent;
        seeker.twelvePassout = twelvePassout;
        seeker.linkedin = linkedin;
        seeker.github = github;

        seeker.skills = skills;
        seeker.jobExperiences = jobExperiences;
        seeker.internExperiences = internExperiences;
        seeker.socialExperiences = socialExperiences;

        // seeker.resumeUrl = resumePath
        //seeker.profilephoto = profilephotopath

        // if (resume) seeker.resumeUrl = `/uploads/resumes/${resume.filename}`;
        // if (profilePhoto) seeker.profilephoto = `/uploads/profilePhotos/${profilePhoto.filename}`;

        console.log("Saving seeker with resumeUrl:", seeker.resumeUrl);
        console.log("Saving seeker with profilephoto:", seeker.profilephoto);

        await seeker.save();

        res.status(200).json({ message: 'Profile created successfully', seeker });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creating profile' });
    }
};

exports.editJobSeekerProfile = async (req, res, next) => {
    const seekerId = req.userId;

    const jobExperiences = JSON.parse(req.body.jobExperiences || "[]");
    const internExperiences = JSON.parse(req.body.internExperiences || "[]");
    const socialExperiences = JSON.parse(req.body.socialExperiences || "[]");
    const skills = JSON.parse(req.body.skills || "[]");
    const {
        name, dob, location, currentProfession, about,
        qualification, course, college, cgpa, graduationYear,
        tenthSchool, tenthPercent, tenthPassout,
        twelveSchool, twelfthPercent, twelvePassout,
        linkedin, github, phone
    } = req.body;

    try {
        const jobSeeker = await JobSeeker.findById(seekerId)
        if (!jobSeeker) {
            return res.status(404).json({ message: 'Please login to view your profile' })
        }
        // console.log(jobSeeker)
        // console.log(jobSeeker.resumeUrl)
        // console.log(jobSeeker.profilephoto)

        // if (req.files?.resume?.[0]) {
        //     const resumePath = req.files.resume[0].path.replace(/\\/g, "/").split("uploads/")[1];
        //     const resumePath2=`uploads/${resumePath}`;
        //     console.log(resumePath2)
        //     if (jobSeeker.resumeUrl && jobSeeker.resumeUrl !== resumePath) {
        //         clearImage(jobSeeker.resumeUrl)
        //     }
        //     jobSeeker.resumeUrl = resumePath2

        // }
        // console.log("User ID:", req.userId);
        // console.log("User Document:", await JobSeeker.findById(req.userId));
        // console.log("FILES:", req.files);

        // if (req.files?.profilePhoto?.[0]) {
        //     const photoPath = req.files.profilePhoto[0].path.replace(/\\/g, "/").split("uploads/")[1];;
        //     const photoPath2=`uploads/${photoPath}`;
        //     //console.log(photoPath2)           
        //      if (jobSeeker.profilephoto && jobSeeker.profilephoto !== photoPath) {
        //         clearImage(jobSeeker.profilephoto)
        //         //console.log(photoPath)
        //     }
        //     jobSeeker.profilephoto = photoPath2;
        // }
        // if (req.files?.resume?.[0]) {
        //     const newResumeUrl =
        //       req.files.resume[0].secure_url || req.files.resume[0].url || req.files.resume[0].path;
        
        //     if (jobSeeker.resumeUrl && jobSeeker.resumeUrl !== newResumeUrl) {
        //       await clearImage(jobSeeker.resumeUrl);
        //     }
        
        //     jobSeeker.resumeUrl = newResumeUrl;
        //     console.log(newResumeUrl)
        // }
        
        // if (req.files?.profilePhoto?.[0]) {
        //     const newPhotoUrl =
        //       req.files.profilePhoto[0].secure_url || req.files.profilePhoto[0].url || req.files.profilePhoto[0].path;
        
        //     if (jobSeeker.profilephoto && jobSeeker.profilephoto !== newPhotoUrl) {
        //       await clearImage(jobSeeker.profilephoto);
        //     }
        
        //     jobSeeker.profilephoto = newPhotoUrl;
        // }

        if (req.files?.resume?.[0]) {
            const resumeFile = req.files.resume[0];
            const newResumeUrl = resumeFile.secure_url || resumeFile.url || resumeFile.path;
          
            if (jobSeeker.resumeUrl && jobSeeker.resumeUrl !== newResumeUrl) {
              await clearImage(jobSeeker.resumeUrl);
            }
          
            jobSeeker.resumeUrl = newResumeUrl;
            console.log("✅ Resume Uploaded:", newResumeUrl);
          }
          
          if (req.files?.profilePhoto?.[0]) {
            const photoFile = req.files.profilePhoto[0];
            const newPhotoUrl = photoFile.secure_url || photoFile.url || photoFile.path;
          
            if (jobSeeker.profilephoto && jobSeeker.profilephoto !== newPhotoUrl) {
              await clearImage(jobSeeker.profilephoto);
            }
          
            jobSeeker.profilephoto = newPhotoUrl;
            console.log("✅ Profile Photo Uploaded:", newPhotoUrl);
          }
          

        

        jobSeeker.phone=phone || jobSeeker.phone;
        jobSeeker.name = name || jobSeeker.name;
        jobSeeker.dob = dob || jobSeeker.dob;
        jobSeeker.location = location || jobSeeker.location;
        jobSeeker.currentProfession = currentProfession || jobSeeker.currentProfession;
        jobSeeker.about = about || jobSeeker.about;

        jobSeeker.qualification = qualification || jobSeeker.qualification;
        jobSeeker.course = course || jobSeeker.course;
        jobSeeker.college = college || jobSeeker.college;
        jobSeeker.cgpa = cgpa || jobSeeker.cgpa;
        jobSeeker.graduationYear = graduationYear || jobSeeker.graduationYear;

        jobSeeker.tenthSchool = tenthSchool || jobSeeker.tenthSchool;
        jobSeeker.tenthPercent = tenthPercent || jobSeeker.tenthPercent;
        jobSeeker.tenthPassout = tenthPassout || jobSeeker.tenthPassout;

        jobSeeker.twelveSchool = twelveSchool || jobSeeker.twelveSchool;
        jobSeeker.twelfthPercent = twelfthPercent || jobSeeker.twelfthPercent;
        jobSeeker.twelvePassout = twelvePassout || jobSeeker.twelvePassout;

        jobSeeker.linkedin = linkedin || jobSeeker.linkedin;
        jobSeeker.github = github || jobSeeker.github;

        jobSeeker.skills = skills || jobSeeker.skills;
        jobSeeker.jobExperiences = jobExperiences || jobSeeker.jobExperiences;
        jobSeeker.internExperiences = internExperiences || jobSeeker.internExperiences;
        jobSeeker.socialExperiences = socialExperiences || jobSeeker.socialExperiences;

        // console.log("Saving seeker with resumeUrl:", jobSeeker.resumeUrl);
        // console.log("Saving seeker with profilephoto:", jobSeeker.profilephoto);


        const result = await jobSeeker.save();
        res.status(200).json({ message: "Profile updated", jobSeeker: result });
    }
    catch (err) {
        if (!err.statusCode) err.statusCode = 500;
        next(err);
    }
}

exports.getName=async(req,res,next)=>{
    try{
        const userid=req.userId
        const user= await JobSeeker.findById(userid)
        res.status(200).json({
            name:user.name,
            message: "name fetched",
            userId:req.userId
        })
    }
    catch(err){
        if (!err.statusCode) err.statusCode = 500;
        next(err);
    }
}

exports.getUsers=async(req,res,next)=>{
    try{
        const users=await JobSeeker.find({_id:{$ne : req.userId}});
        res.status(200).json({users})
    }catch(err){
        res.status(500).json({error:'Server error'})
    }
}

exports.getUserprofile=async(req,res,next)=>{
    const userId=req.params.Id
    try{
        const targetUser=await JobSeeker.findById(userId)
        res.status(200).json({targetUser})
    }catch(err){
        res.status(500).json({error:'Server error'})
    }
}

//sending requests
exports.connectUser=async(req,res,next)=>{
    const receiverId =req.params.userId
    const senderId =req.userId;

    if (senderId === receiverId) return res.status(400).json({ error: "Can't send request to yourself." });

    const sender=await JobSeeker.findById(senderId)
    const receiver = await JobSeeker.findById(receiverId);

    if(receiver.connectionRequests.includes(senderId)||receiver.connections.includes(senderId)){
        return res.status(400).json({ error: 'Already connected or pending request.' });
    }
    receiver.connectionRequests.push(senderId);
  sender.sentRequests.push(receiverId);
  await receiver.save();
  await sender.save();

  res.json({ message: 'Connection request sent.' });
}

exports.getPendingRequests=async(req,res,next)=>{
    const user=await JobSeeker.findById(req.userId).populate('connectionRequests', 'name email currentProfession profilephoto')
    res.status(200).json(user.connectionRequests)
}

exports.AcceptRequest=async(req,res,next)=>{
    const userId=req.userId
    const senderId=req.params.Id

    const user=await JobSeeker.findById(userId)
    const sender=await JobSeeker.findById(senderId)

    if (!user.connectionRequests.includes(senderId)){
        return res.status(400).json({ error: 'No such request found.' });
    }

    user.connections.push(senderId)
    sender.connections.push(userId);

    user.connectionRequests = user.connectionRequests.filter(id => id.toString() !== senderId.toString());
  sender.sentRequests = sender.sentRequests.filter(id => id.toString() !== userId.toString());

  await user.save();
  await sender.save();

  res.json({ message: 'Connection accepted.' });

}

exports.RejectRequest=async(req,res,next)=>{
    const userId=req.userId
    const senderId=req.params.Id

    const user=await JobSeeker.findById(userId)
    const sender=await JobSeeker.findById(senderId)

    user.connectionRequests = user.connectionRequests.filter(id => id.toString() !== senderId.toString());
    sender.sentRequests = sender.sentRequests.filter(id => id.toString() !== userId.toString());

  await user.save();
  await sender.save();

  res.json({ message: 'Connection rejectet.' });

}

exports.getConnections=async(req,res,next)=>{
    const userId=req.userId
    try{
        const user=await JobSeeker.findById(userId)
        const connectionIds=user.connections
        const connection = await JobSeeker.find({ _id: { $in: connectionIds } });
        res.status(200).json({connection})
    }
    catch(err){
        if (!err.statusCode) err.statusCode = 500;
        next(err);
    }
}

exports.getSendRequests=async(req,res,next)=>{
    const userId=req.userId
    try{
        const user=await JobSeeker.findById(userId)
        const sentIds=user.sentRequests
        const sendRequests = await JobSeeker.find({ _id: { $in: sentIds } });
        // console.log(sendRequests)
        res.status(200).json({sendRequests})
    }
    catch(err){
        if (!err.statusCode) err.statusCode = 500;
        next(err);
    }
}

exports.getConnectionRequests=async(req,res,next)=>{
    const userId=req.userId
    try{
        const user=await JobSeeker.findById(userId)
        const requestIds=user.connectionRequests
        const connectionreq = await JobSeeker.find({ _id: { $in: requestIds } });
        res.status(200).json({connectionreq})
    }
    catch(err){
        if (!err.statusCode) err.statusCode = 500;
        next(err);
    }
}
exports.unrequestUser = async (req, res, next) => {
    const senderId = req.userId;
    const receiverId = req.params.userId;
  
    try {
      const sender = await JobSeeker.findById(senderId);
      const receiver = await JobSeeker.findById(receiverId);
  
      if (!sender || !receiver) {
        return res.status(404).json({ error: "User not found." });
      }
  
      sender.sentRequests = sender.sentRequests.filter(id => id.toString() !== receiverId.toString());
      receiver.connectionRequests = receiver.connectionRequests.filter(id => id.toString() !== senderId.toString());
  
      await sender.save();
      await receiver.save();
  
      res.status(200).json({ message: "Connection request withdrawn successfully." });
    } catch (err) {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    }
  };

  exports.removeConnection = async (req, res, next) => {
    const userId = req.userId;
    const removeId = req.params.userId;
  
    try {
      const user = await JobSeeker.findById(userId);
      const toRemove = await JobSeeker.findById(removeId);
  
      if (!user || !toRemove) {
        return res.status(404).json({ error: "User not found." });
      }
  
      user.connections = user.connections.filter(id => id.toString() !== removeId.toString());
      toRemove.connections = toRemove.connections.filter(id => id.toString() !== userId.toString());
  
      await user.save();
      await toRemove.save();
  
      res.status(200).json({ message: "Connection removed successfully." });
    } catch (err) {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    }
  };
  
  
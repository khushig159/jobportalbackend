const jwt=require('jsonwebtoken');
const JobSeeker=require('../model/seeker')

 const authSeeker=async(req,res,next)=>{
    const refreshToken = req.cookies?.userrefreshToken || req.body.userrefreshToken;
    if(!refreshToken){
        return res.status(401).json({message:"Unauthorized"});
    }
    try{
        const decoded=jwt.verify(refreshToken,'somesupersupersecretkey');
        const user=await JobSeeker.findById(decoded.userId);
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        if(user.refreshToken !== refreshToken){
            return res.status(403).json({message:"Forbidden"});
        }
        req.userId = user._id;
        next();
    } catch (error) {
        return res.status(500).json({ message: "Error in authentication" });
    }
}
module.exports=authSeeker;
const jwt = require('jsonwebtoken');
const Recruiter = require('../model/recruiter');

const authRecruiter = async (req, res, next) => {
  // Attempt to get the token from cookies or fallback to body
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "Unauthorized: No refresh token provided" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(refreshToken, 'somesupersecretkey'); // 🔐 Use env in prod!
    // console.log("Decoded Token:", decoded); // Add this line
    // console.log("Trying to find recruiter with ID:", decoded._id);

    // Find recruiter from DB
    const user = await Recruiter.findById(decoded._id);
    // console.log("Fetched Recruiter:", user); // Add this line

    if (!user) {
      return res.status(404).json({ message: "Recruiter not found" });
    }

    // Check if stored token matches
    if (user.refreshTokenrecruiter !== refreshToken) {
      return res.status(403).json({ message: "Forbidden: Invalid refresh token" });
    }

    // Attach user ID to request for use in next handler
    req.recruiteruserId = user._id;
    req.recruiteruser= user; // Attach the user object if needed
    next();

  } catch (err) {
    return res.status(500).json({ message: "Error in recruiter authentication", error: err.message });
  }
};

module.exports = authRecruiter;

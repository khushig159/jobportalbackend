#  Workora – Job Portal Backend

A powerful and secure Node.js backend for the **Workora Job Portal**, enabling smart hiring solutions, secure user authentication, real-time messaging, resume parsing via AI, and file handling with cloud storage.

>  [Frontend Repository](https://github.com/khushig159/jobportalfrontend)  
>  Live Project: [workorajobs.netlify.app](https://workorajobs.netlify.app/)
>  Video Demo: https://drive.google.com/file/d/10kt1y82IoMO3X8TA7n12ar8PV06j9Ezr/view?usp=drivesdk

---

##  Features

###  Authentication & Authorization
- JWT-based authentication for job seekers and recruiters
- Middleware for **role-based route protection**
- Secure login, signup, password recovery

###  Recruiter Capabilities
- Post, edit, and manage job listings
- View applicants and parsed resumes
- Upload and manage company logo
- Real-time chat with job seekers

###  Job Seeker Features
- Create & update profile
- Upload resume
- Save & apply to jobs
- View application history
- AI chat assistant for career queries
- Profile photo management

###  AI-Powered Resume Parsing & Advice
- Upload PDF/Doc resumes
- Extracts skills, education, experience using OpenAI
- Suggests job matches and gives **career-related advice only**
- Uses prompt engineering to restrict scope to jobs/career

###  File Handling & Cloudinary Integration
- **Resume, profile photo, company logo** uploads supported
- Securely stored using **Cloudinary**
- Uploads categorized into folders

> **Note**: Resume file access may be restricted due to secure storage on Cloudinary.

---

## 🛠 Tech Stack

| Area               | Technology                    |
|--------------------|-------------------------------|
| Runtime            | Node.js                       |
| Server Framework   | Express.js                    |
| Database           | MongoDB                       |
| Auth               | JWT, bcrypt                   |
| File Upload        | Multer                        |
| Cloud Storage      | Cloudinary                    |
| AI Services        | gemini API                    |
| Email Service      | Nodemailer + Gmail OAuth2     |
| Parsing Logic      | Custom Resume Parser + AI     |
| Real-Time Chat     | Socket.io                     |
| Environment        | dotenv                        |
| Deployment         | (Suggest: Render, Railway, etc.) |

---

##  API Endpoints Overview

> Here’s a glimpse of modular routes:

| Route Prefix        | Purpose                            |
|---------------------|-------------------------------------|
| `/auth`             | Login, Signup, Verification         |
| `/recruiter`        | Job posting, profile, edit profile,...        |
| `/seeker`           | Resume upload, profile, jobs...       |
| `/chat`             | Chat creation and retrieval         |
| `/messages`         | Message thread handling             |

---

##  Future Enhancements
- Admin dashboard and job moderation
- Resume parsing via ML locally (privacy-focused)
- Chatbot with voice integration
- Email notification system (applied, shortlisted)
- Analytics for recruiters

##  Environment Variables

You must create a `.env` file with the following:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
GEMINI_API_KEY=your_gemini_key
EMAIL_USER=your_gmail_id
EMAIL_PASS=your_gmail_oauth_or_app_password


##  Folder Structure
```bash
├── controller/ # Core business logic
│ ├── auth-recruiter.js
│ ├── auth.js
│ ├── messages.js
│ ├── recruiter.js
│ └── seeker.js
│
├── middleware/ # JWT and role-based protection
│ ├── auth-recruiter.js
│ └── auth-seeker.js
│
├── model/ # MongoDB Schemas
│ ├── Jobs.js
│ ├── Messages.js
│ ├── Recruiter.js
│ └── Seeker.js
│
├── routes/ # API route handlers
│ ├── auth.js
│ ├── chat.js
│ ├── messages.js
│ ├── recruiter.js
│ └── seeker.js
│
├── uploads/ # File Upload Directory
│ ├── CompanyLogo/
│ ├── profilePhotos/
│ ├── resumechat/
│ └── resumes/
│
├── utils/ # Utilities & External Services
│ ├── cloudinary.js
│ ├── gmail.js
│ ├── mailer.js
│ ├── openai.js
│ └── resumeParser.js
│
├── .env # Environment variables
├── app.js # Entry point


# Step 1: Clone the repository
git clone https://github.com/your-username/job-portal-backend.git
cd server

# Step 2: Install dependencies
npm install

# Step 3: Add environment variables
touch .env
# (Add .env keys as shown above)

# Step 4: Run server
node app.js

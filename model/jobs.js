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

 {/* <div className="form-wrapper">
        <div className="form-container">
          <div className="form-heading">
            <p>Post a job</p>
          </div>
          <form className="job-form">
            <div className="form-containerinner">
              <div className="form-group">
                <label>
                  <p>Job title</p>
                  <input
                    ref={jobTitle}
                    type="text"
                    placeholder="e.g. Software Engineer"
                  />
                </label>
              </div>
              <div className="form-group">
                <label>
                  <p>Industry</p>
                  <input
                    ref={industry}
                    type="text"
                    placeholder="e.g. Technology, Finance.."
                  />
                </label>
              </div>
            </div>

            <div className="form-containerinner">
              <div className="form-group">
                <label>
                  <p>Job description</p>
                  <textarea
                    ref={jobDescription}
                    placeholder="Describe the responsibilities, requirements, and benefits of the role"
                  ></textarea>
                </label>
              </div>

              <div className="form-group">
                <label>
                  <p>Requirements</p>
                  <textarea
                    ref={requirements}
                    placeholder="List the required skills, qualifications, and experience"
                  ></textarea>
                </label>
              </div>
            </div>

            <div className="form-containerinner">
              <div className="form-group">
                <label>
                  <p>Job-Type</p>
                  <input
                    ref={jobType}
                    type="text"
                    placeholder="e.g. Full-time, part-time.."
                  />
                </label>
              </div>
              <div className="form-group">
                <label>
                  <p>Location</p>
                  <input
                    ref={location}
                    type="text"
                    placeholder="e.g. San Francisco, CA Or remote"
                  />
                </label>
              </div>
            </div>

            <div className="form-containerinner">
              <div className="form-group">
                <label>
                  <p>Salary range</p>
                  <input
                    ref={salaryRange}
                    type="text"
                    placeholder="Minimum-Maximum"
                  />
                </label>
              </div>

              <div className="form-group">
                <label>
                  <p>Experience Level</p>
                  <input
                    ref={experienceLevel}
                    type="text"
                    placeholder="Fresher, experience.."
                  />
                </label>
              </div>
            </div>
            <div className="form-containerinner">
              <div className="form-group">
                <label>
                  <p>Application deadline</p>
                  <input
                    ref={applicationDeadline}
                    type="date"
                    placeholder="MM/DD/YYYY"
                  />
                </label>
              </div>
              <div className="form-group">
                <label>
                  <p>Work Mode</p>
                  <input type="text" ref={place} />
                </label>
              </div>
            </div>
            <div className="form-submit">
              <button onClick={handleSubmit} type="submit">
                Post Job
              </button>
            </div>
          </form>
        </div>
      </div> */}
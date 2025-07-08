const express = require("express");
const router = express.Router();
const generateGeminiResponse = require('../utils/gemini');
const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const path = require("path");
const extractTextFromResume = require('../utils/resumeParser')

const resumeStorage = multer.diskStorage({
    destination: (res, file, cb) => {
        cb(null, 'uploads/resumechat')
    },
    filename: (req, file, cb) => {
        cb(null, uuidv4() + '-' + file.originalname)
    }
})

const resumeFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.pdf', '.docx'];

    if (allowedExts.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid resume format'), false);
    }
}

const uploadResume = multer({
    storage: resumeStorage,
    fileFilter: resumeFilter,
    limits: { fileSize: 2 * 1024 * 1024 }
})

router.post("/chat",uploadResume.single("resumechat"), async (req, res, next) => {
    const { prompt } = req.body;

    try {
        let finalPrompt = '';

        if (req.file) {
            const resumeText = await extractTextFromResume(req.file.path);

            finalPrompt = `User uploaded the following resume: ${resumeText}

            Query: "${prompt || "please analyze and suggest improvements"}"
            
            Response with:
            - Career advice
            - Skill analysis
            - Resume feedback
            - jobs which are best suited
            - what skills are required to add more
            - Suggestions for improvement
      `;
        }else if (prompt){
            finalPrompt =`
            Answer only career,skill,jobs,internships,interviews etc.related queries. Avoid unrelated topics.

            Query: "${prompt}"
            `;
        }
        else{
            return res.status(400).json({ error: "Prompt or resume required" });
        }

        const response=await generateGeminiResponse(finalPrompt)
        res.json({ response });    
    }
    catch (err) {
        console.error("Chat Error:", err.message);
        res.status(500).json({ error: "Failed to handle chat request." });
      } finally {
        if (req.file) {
          fs.unlink(req.file.path, () => {}); // optional cleanup
        }
      }
    });


module.exports = router;

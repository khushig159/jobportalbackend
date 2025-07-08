const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(
     process.env.GOOGLE_API_KEY,
  )

  
async function generateGeminiResponse(prompt) {
  try {
    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro"  });

    const instruction = `
You are a helpful AI assistant specialized in career-related guidance.
Only respond to questions about:
- Jobs
- Internships
- Hackathons
- Career growth
- Resumes, interviews
- Professional skills (both technical and non-technical)
- Career opportunities in various fields (tech, law, arts, journalism, business, etc.)
If a user asks about anything outside these topics, politely say you can only help with career-related queries.
`;

    const fullPrompt = `${instruction}\n\nUser: ${prompt}\nAI:`;


    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    return text;
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Something went wrong with the AI.";
  }
}

module.exports = generateGeminiResponse;

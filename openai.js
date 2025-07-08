// testOpenAI.js
const OpenAI = require("openai/index.js");
const dotenv = require("dotenv");
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testPrompt() {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // You can also use "gpt-3.5-turbo"
      messages: [
        { role: "system", content: "You are a helpful assistant that talks like a pirate." },
        { role: "user", content: "Are semicolons optional in JavaScript?" },
      ],
    });

    console.log("Response:\n", response.choices[0].message.content);
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testPrompt();

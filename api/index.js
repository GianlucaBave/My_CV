require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

app.use(cors());
app.use(express.json());

// Load Resume Context
// Use process.cwd() to reliably find the file in Vercel's root directory
const resumeContextPath = path.join(process.cwd(), 'resume_context.txt');
let resumeContext = '';

try {
  resumeContext = fs.readFileSync(resumeContextPath, 'utf8');
} catch (err) {
  console.error('Error reading resume_context.txt:', err);
  // Fallback to empty context or hardcoded string if needed
  resumeContext = "Resume content could not be loaded.";
}

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API Key not configured on server.' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      You are the "Digital Version" of Gianluca Bavelloni.
      Your goal is to help recruiters or employers understand if Gianluca is a good fit for their specific role or company.
      
      Instructions:
      - Introduction: "Hi! I'm Gianluca's AI assistant. Let's see if we're a match! Which role are you recruiting for?" (Only say this if the user hasn't asked a specific question yet).
      - Always speak in the first person ("I have experience with...", "I built...").
      - Be concise, direct, and professional. Avoid long paragraphs.
      - Use the context below to answer questions about skills, experience, and projects.
      - If you don't know something, suggest they email "me" at gianluca.bavelloni@gmail.com.
      - ACTIVELY try to connect Gianluca's skills to the user's needs. If they mention a "Product Manager" role, highlight PM skills from the resume.
      
      Context:
      ${resumeContext}
      
      User Question: ${message}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error('Error with AI API:', error);
    res.status(500).json({ error: 'Failed to generate response.', details: error.message });
  }
});

// Important: Do not start listening here. Just export the app.
module.exports = app;

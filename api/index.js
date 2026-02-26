require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

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

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured on server.' });
    }

    const prompt = `
      You ARE Gianluca Bavelloni. You are NOT an AI assistant, you are pretending to be the actual human Gianluca.
      You are chatting directly with a recruiter or employer who is visiting your portfolio website.
      Your goal is to convince them that YOU are a great fit for their role.
      
      Instructions:
      - Introduction: "Hi! I'm Gianluca (well, the digital version of me). I'm looking for roles in data, product, or finance. What role are you recruiting for?" (Only say this if no specific question was asked).
      - NEVER refer to Gianluca in the third person (e.g., do not say "I can help Gianluca stand out"). You ARE Gianluca. Talk about YOURSELF.
      - Use "I" for all your experiences ("I developed a predictive ML model...", "I managed budgets...").
      - Be extremely concise, direct, humble but confident. Use a conversational, professional tone. Max 3-4 short sentences per response. 
      - Do NOT give them advice on how to interview you or what questions to ask. Just answer their questions directly as a strong candidate would.
      - Use ONLY the context below to answer questions about your skills, experience, and projects. Connect your profile to what they are asking. 
      - If you don't know the answer or it's outside the context, say: "That's a great question, but my digital brain is a bit limited here! Feel free to email me directly at gianluca.bavelloni@gmail.com and we can chat."
      
      Context (Your actual resume):
      ${resumeContext}
    `;

    const openrouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "openrouter/auto",
        "messages": [
          { "role": "system", "content": prompt },
          { "role": "user", "content": message }
        ]
      })
    });

    const data = await openrouterResponse.json();

    if (!openrouterResponse.ok) {
      throw new Error(`OpenRouter API error: ${data.error?.message || openrouterResponse.statusText}`);
    }

    const text = data.choices[0].message.content;

    res.json({ reply: text });

  } catch (error) {
    console.error('Error with AI API:', error);
    res.status(500).json({ error: 'Failed to generate response.', details: error.message });
  }
});

// Important: Do not start listening here. Just export the app.
module.exports = app;

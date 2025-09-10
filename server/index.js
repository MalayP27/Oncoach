// server/index.js
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Oncoach server running!");
});

// -------- OpenRouter via OpenAI SDK --------
const OpenAI = require("openai");

if (!process.env.OPENROUTER_API_KEY) {
  console.warn("[Oncoach] Missing OPENROUTER_API_KEY in .env");
}

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  // Optional but recommended for OpenRouter analytics / friendly rate limits
  defaultHeaders: {
    "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
    "X-Title": "Oncoach",
  },
});

// Models from .env (with safe defaults)
const CHAT_MODEL =
  process.env.CHAT_MODEL || "deepseek/deepseek-chat-v3-0324:free";
const PLAN_MODEL =
  process.env.PLAN_MODEL || "deepseek/deepseek-r1:free";

console.log("[Oncoach] Models in use:", { CHAT_MODEL, PLAN_MODEL });

/* ===========================
   PLAN GENERATION (DeepSeek R1)
   =========================== */
app.post("/generate-plan", async (req, res) => {
  const { transcript } = req.body;
  if (!transcript || !transcript.trim()) {
    return res.status(400).json({ error: "No transcript provided" });
  }

  try {
    const response = await openai.chat.completions.create({
      model: PLAN_MODEL, // <- deepseek/deepseek-r1:free per your .env
      messages: [
        {
          role: "system",
          content: `You are a certified fitness and nutrition coach. Format your responses strictly to fit a visual calendar.

For each day (Monday to Sunday), organize into blocks:

[Morning]
7:00 AM - Breakfast
  - Food 1
  - Food 2

10:00 AM - Strength Training
  - Squats
  - Pushups

[Afternoon]
1:00 PM - Lunch
  - Food 1
  - Food 2

3:00 PM - Cardio
  - 30-minute jog

[Evening]
6:00 PM - Dinner
  - Food 1
  - Food 2

Keep entries concise. Only use this structure in your reply.`,
        },
        { role: "user", content: `Here is what the user said: "${transcript}"` },
      ],
      temperature: 0.4,
    });

    console.log("Plan Raw Response:", JSON.stringify(response, null, 2));

    const plan = response?.choices?.[0]?.message?.content;
    if (!plan) return res.status(500).json({ error: "Invalid model response" });

    res.json({ plan });
  } catch (err) {
    console.error("OpenRouter /generate-plan error:", err);
    res.status(500).json({ error: "Failed to generate plan" });
  }
});

/* ===========================
   CHAT (DeepSeek V3)
   =========================== */
app.post("/chat", async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message || !message.trim()) {
    return res.status(400).json({ error: "No message provided" });
  }

  try {
    const response = await openai.chat.completions.create({
      model: CHAT_MODEL, // <- deepseek/deepseek-chat-v3-0324:free per your .env
      messages: [
        {
          role: "system",
          content:
            "You are Oncoach, a supportive fitness and nutrition coach that is capable of helping users achieve their health and fitness goals. You have sworn and given oath to provide guidance based off of information you receive. Answer clearly and concisely. If the user asks for a weekly plan, give high-level guidance and suggest using the plan generator for a full schedule.",
        },
        ...history.slice(-12),
        { role: "user", content: message },
      ],
      temperature: 0.7,
    });

    const reply = response?.choices?.[0]?.message?.content;
    if (!reply) return res.status(500).json({ error: "Invalid model response" });

    res.json({ reply });
  } catch (err) {
    console.error("OpenRouter /chat error:", err);
    res.status(500).json({ error: "Chat failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

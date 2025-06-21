const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Oncoach server running!");
});

// OpenAI / OpenRouter API integration
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// POST /generate-plan → returns structured plan from GPT
app.post("/generate-plan", async (req, res) => {
  const { transcript } = req.body;

  if (!transcript) {
    return res.status(400).json({ error: "No transcript provided" });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are a certified fitness and nutrition coach. Format your responses strictly to fit a visual calendar for the user.

                    For each day (Monday to Sunday), organize the plan into time blocks like:

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

                    Keep each time block concise, show the time, type of activity (meal or workout), and a short bullet list below it. Only use this structure in your reply.`,
        },
        {
          role: "user",
          content: `Here is what the user said: "${transcript}"`,
        },
      ],
    });

    console.log("GPT Raw Response:", JSON.stringify(response, null, 2));

    // console.log("💬 GPT Response:\n", data.plan);
    // const parsedEvents = parseWorkoutPlan(data.plan);
    // console.log("🧠 Parsed Events:\n", parsedEvents);
    // setWorkoutEvents(parsedEvents);


    if (!response.choices || !response.choices[0]) {
      return res.status(500).json({ error: "Invalid GPT response format" });
    }

    const plan = response.choices[0].message.content;
    res.json({ plan });
  } catch (err) {
    console.error("OpenRouter error:", err);
    res.status(500).json({ error: "Failed to generate plan" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

import { createContext, useContext, useState } from "react";

const TranscriptContext = createContext();

export const TranscriptProvider = ({ children }) => {
  const [transcript, setTranscript] = useState("");
  const [plan, setPlan] = useState("");
  const [workoutEvents, setWorkoutEvents] = useState({});
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech Recognition not supported.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = "en-US";
    recognition.interimResults = true;

    let finalTranscript = "";
    let debounceTimer;

    recognition.onstart = () => {
      setTranscript("");
      setPlan("");
      setWorkoutEvents({});
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      clearTimeout(debounceTimer);

      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }

      setTranscript(finalTranscript + interim);

      debounceTimer = setTimeout(() => {
        recognition.stop();
      }, 2500);
    };

    recognition.onend = async () => {
      setIsListening(false);
      const finalText = transcript || finalTranscript;

      if (finalText.trim().length > 0) {
        await generatePlan(finalText);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.start();
  };

  const generatePlan = async (userInput) => {
    try {
      const res = await fetch("http://localhost:5000/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: userInput }),
      });

      const data = await res.json();
      setPlan(data.plan);
      console.log("Plan generated:", data.plan);

      const parsedEvents = parseWorkoutPlan(data.plan);
      setWorkoutEvents(parsedEvents);
    } catch (err) {
      console.error("GPT generation failed:", err);
    }
  };

  return (
    <TranscriptContext.Provider
      value={{
        transcript,
        plan,
        isListening,
        startListening,
        workoutEvents, // exposed to Calendar
      }}
    >
      {children}
    </TranscriptContext.Provider>
  );
};

//Helper to convert GPT plan to day-wise structure
const parseWorkoutPlan = (text) => {
    const days = [
      "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
    ];
  
    const eventsByDay = {};
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  
    let currentDay = null;
    let currentBlock = null;
    let currentItem = null;
  
    for (let line of lines) {
      // 1. Detect Day
      for (let day of days) {
        if (line.startsWith(`**${day}`) || line.startsWith(`${day}:`)) {
          currentDay = day.slice(0, 3); // e.g., "Mon"
          eventsByDay[currentDay] = [];
          currentBlock = null;
          currentItem = null;
          break;
        }
      }
  
      // 2. Detect Block (Morning, Afternoon, etc.)
      if (line.match(/^\[(Morning|Afternoon|Evening)\]/i)) {
        currentBlock = line.replace(/[\[\]]/g, "");
        continue;
      }
  
      // 3. Detect Main Time Entry (e.g., 7:00 AM - Breakfast)
      const match = line.match(/^(\d{1,2}:\d{2} [APM]{2}) - (.+)/);
      if (match) {
        currentItem = {
          time: match[1],
          title: match[2],
          block: currentBlock,
          description: [],
        };
        if (currentDay) {
          eventsByDay[currentDay].push(currentItem);
        }
        continue;
      }
  
      // 4. Detect description bullets
      if (line.startsWith("-") && currentItem) {
        currentItem.description.push(line.replace(/^-/, "").trim());
      }
    }

    Object.keys(eventsByDay).forEach((day) => {
        eventsByDay[day].sort((a, b) =>
          new Date(`1970/01/01 ${a.time}`) - new Date(`1970/01/01 ${b.time}`)
        );
    });
      
  
    return eventsByDay;
  };
  
  
  

export const useTranscript = () => useContext(TranscriptContext);

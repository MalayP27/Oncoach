export const handleStartSession = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
  
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }
  
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;
  
    recognition.onstart = () => {
      console.log("Listening...");
    };
  
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("You said:", transcript);
      alert(`You said: "${transcript}"`);
      // Later: send to GPT or update state
    };
  
    recognition.onerror = (event) => {
      console.error("Speech error:", event.error);
      alert("Speech recognition error: " + event.error);
    };
  
    recognition.start();
  };
  
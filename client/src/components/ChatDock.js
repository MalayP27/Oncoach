import React, { useState, useRef, useEffect } from "react";
import { useTranscript } from "../context/TranscriptContext";

export default function ChatDock() {
  const { generatePlan } = useTranscript();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I’m Oncoach. Ask me anything, or write what you want in a weekly plan and click “Generate Plan” to update your calendar." }
  ]);

  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, open]);

  const sendToChat = async () => {
    const text = input.trim();
    if (!text) return;

    const newHistory = [...messages, { role: "user", content: text }];
    setMessages(newHistory);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: newHistory.map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await res.json();
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Sorry, I couldn't get a response." },
        ]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network error. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  };

  const sendAsPlan = async () => {
    const text = input.trim();
    if (!text) return;
    setSending(true);
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text },
      { role: "assistant", content: "Got it! Generating a weekly plan and updating your calendar…" },
    ]);
    setInput("");

    try {
      await generatePlan(text); // uses your existing pipeline + parser
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Plan generated and calendar updated." },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Failed to generate a plan. Please try again." },
      ]);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendToChat();
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 bg-orange-500 hover:bg-orange-600 text-white rounded-full px-4 py-2 shadow-lg"
      >
        {open ? "Close Chat" : "Chat"}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-6 w-96 max-w-[95vw] bg-white border shadow-xl rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-orange-50 border-b text-sm font-semibold text-orange-700">
            Oncoach
          </div>

          <div ref={bodyRef} className="max-h-96 overflow-y-auto p-3 space-y-3">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`text-sm leading-relaxed ${
                  m.role === "assistant" ? "text-gray-800" : "text-gray-900"
                }`}
              >
                <div className={`rounded-md px-3 py-2 inline-block ${
                  m.role === "assistant"
                    ? "bg-gray-100"
                    : "bg-orange-100"
                }`}>
                  <span className="block whitespace-pre-wrap">{m.content}</span>
                </div>
              </div>
            ))}
            {sending && (
              <div className="text-xs text-gray-500">Oncoach is typing…</div>
            )}
          </div>

          <div className="p-3 border-t bg-white">
            <textarea
              className="w-full border rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
              rows={2}
              placeholder="Type your message… (Enter to send, Shift+Enter for newline)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
            />
            <div className="flex gap-2 justify-end mt-2">
              <button
                disabled={sending}
                onClick={sendToChat}
                className="px-3 py-1.5 text-sm bg-gray-800 hover:bg-black text-white rounded-md disabled:opacity-60"
              >
                Send
              </button>
              <button
                disabled={sending}
                onClick={sendAsPlan}
                className="px-3 py-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-md disabled:opacity-60"
              >
                Generate Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

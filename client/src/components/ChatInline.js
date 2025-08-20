import React, { useEffect, useRef, useState } from "react";
import { useTranscript } from "../context/TranscriptContext";

/**
 * Inline chat panel for the Home page.
 * - "Send" => normal chat via /chat
 * - "Generate Plan" => uses context.generatePlan to update the calendar from typed text
 */
export default function ChatInline({ className = "" }) {
  const { generatePlan } = useTranscript();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hey! I’m your Oncoach assistant. You can type questions here, or describe your week and hit “Generate Plan” to update your calendar.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bodyRef = useRef(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages]);

  const sendToChat = async () => {
    const text = input.trim();
    if (!text) return;

    const history = [...messages, { role: "user", content: text }];
    setMessages(history);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: history.map(({ role, content }) => ({ role, content })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data?.reply || "Sorry, I couldn’t get a response.",
        },
      ]);
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
      {
        role: "assistant",
        content: "Got it! Generating a weekly plan and updating your calendar…",
      },
    ]);
    setInput("");

    try {
      await generatePlan(text);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "✅ Plan generated and calendar updated." },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Failed to generate a plan." },
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
    <div
      className={`w-full max-w-2xl bg-white border rounded-xl shadow-sm ${className}`}
    >
      <div className="px-4 py-3 bg-orange-50 border-b text-sm font-semibold text-orange-700 rounded-t-xl">
        Chat with Oncoach
      </div>

      {/* messages */}
      <div ref={bodyRef} className="max-h-64 overflow-y-auto p-3 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className="text-sm leading-relaxed">
            <div
              className={`inline-block rounded-md px-3 py-2 whitespace-pre-wrap ${
                m.role === "assistant" ? "bg-gray-100" : "bg-orange-100"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="text-xs text-gray-500">Oncoach is typing…</div>
        )}
      </div>

      {/* composer */}
      <div className="p-3 border-t bg-white">
        <textarea
          rows={2}
          className="w-full border rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-orange-400"
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
  );
}

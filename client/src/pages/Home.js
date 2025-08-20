// client/src/pages/Home.js
import React from "react";
import { useTranscript } from "../context/TranscriptContext";
import ChatInline from "../components/ChatInline";

export default function Home() {
  const { isListening, startListening } = useTranscript();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <p className="text-gray-600 text-lg mb-4">Let's get active.</p>

      <div className="w-48 h-48 bg-orange-400 rounded-full border-4 border-orange-500 mb-6" />

      <button
        onClick={startListening}
        className="bg-orange-500 text-white px-6 py-2 rounded-md hover:bg-orange-600"
      >
        Talk to Coach
      </button>
      {isListening && (
        <p className="text-sm text-orange-500 mt-2 animate-pulse">Listening...</p>
      )}

      {/* Inline chat section below the hero */}
      <ChatInline className="mt-8" />
    </div>
  );
}

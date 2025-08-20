// client/src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ChatDock from "./components/ChatDock";
import Home from "./pages/Home";
import Calendar from "./pages/Calendar";
import Profile from "./pages/Profile";
import { TranscriptProvider } from "./context/TranscriptContext";

export default function App() {
  return (
    <TranscriptProvider>
      <Router>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 p-4 relative">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>

            {/* Floating chat available on all pages */}
            <ChatDock />
          </div>
        </div>
      </Router>
    </TranscriptProvider>
  );
}

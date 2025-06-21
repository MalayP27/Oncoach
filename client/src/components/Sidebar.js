// client/src/components/Sidebar.js
import React from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div style={{
      width: "200px",
      backgroundColor: "#f7f7f7",
      height: "100vh",
      padding: "1rem",
      borderRight: "1px solid #ddd"
    }}>
      <h2 style={{ fontWeight: "bold", fontSize: "2em" }}>oncoach</h2>
      <nav style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <Link to="/">Home</Link>
        <Link to="/calendar">Calendar</Link>
        <Link to="/profile">Profile</Link>
        <Link to="/">Logout</Link>
      </nav>
    </div>
  );
};

export default Sidebar;

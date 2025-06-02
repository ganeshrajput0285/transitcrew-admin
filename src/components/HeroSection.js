import React from "react";
import { useNavigate } from "react-router-dom";
import "./HeroSection.css";

function HeroSection() {
  const navigate = useNavigate();

  return (
    <div className="hero-section">
      <div className="hero-buttons">
      <div className="button-column left">
        <button onClick={() => navigate("/admin/live-data")}>Live Data</button>
        <button onClick={() => navigate("/admin/roster")}>Roster Management</button>
        <button onClick={() => navigate("/admin/employees")}>Employee Details</button>
        
<button onClick={() => navigate("/admin/users")}>User Management</button>
 </div>
    <div className="button-column right">
        <button onClick={() => navigate("/admin/new-sop")}>New SOP</button>
        <button onClick={() => navigate("/admin/overtime")}>Overtime Tracking</button>
<button onClick={() => navigate("/admin/night-data")}>Night Data</button>
      </div>
</div>
    </div>
  );
}

export default HeroSection;

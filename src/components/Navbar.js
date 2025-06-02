import React from "react";
import { Link } from "react-router-dom";
import Logo from '../assets/transitcrew-logo.svg';
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
 <div className="navbar-left">
        <img src={Logo} alt="TransitCrew Logo" className="navbar-logo" />
        <span className="navbar-title">TransitCrew Admin</span>
      </div>
      <ul className="nav-links">
        <li><Link to="/admin/dashboard">Dashboard</Link></li>
        <li><Link to="/admin/welcome">Profile</Link></li>
        <li><Link to="/login">Logout</Link></li>
      </ul>
    </nav>
  );
}

export default Navbar;

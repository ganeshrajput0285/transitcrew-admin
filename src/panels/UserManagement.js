import React from "react";
import { useNavigate } from "react-router-dom";
import "./UserManagement.css";

function UserManagement() {
  const navigate = useNavigate();

  return (
    <div className="user-management">
      <h1>User Management</h1>
      <div className="user-options">
        <button onClick={() => navigate("/admin/users/requests")}>Requests</button>
        <button onClick={() => navigate("/admin/users/employees")}>Employees</button>
      </div>
    </div>
  );
}

export default UserManagement;

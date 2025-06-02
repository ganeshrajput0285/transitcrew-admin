// src/pages/Employees.js or wherever you list employees
import React, { useEffect, useState } from "react";
import API from "../services/api";

const Employees = () => {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    API.get("/api/admin/employees")
      .then((res) => setEmployees(res.data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h2>Approved Employees</h2>
      <ul>
        {employees.map((emp) => (
          <li key={emp._id}>{emp.name} - {emp.baNumber}</li>
        ))}
      </ul>
    </div>
  );
};

export default Employees;

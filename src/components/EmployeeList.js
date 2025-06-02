import { useEffect, useState } from "react";
import { getEmployees } from "../api/api"; // Import API function

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    getEmployees() // Call API
      .then((response) => setEmployees(response.data))
      .catch((error) => console.error("Error fetching employees:", error));
  }, []);

  return (
    <div>
      <h2>Employee List</h2>
      {employees.map((emp) => (
        <div key={emp._id}>{emp.name} - {emp.designation}</div>
      ))}
    </div>
  );
};

export default EmployeeList;
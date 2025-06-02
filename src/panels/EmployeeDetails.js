import React, { useEffect, useState } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient"; // Update path to your Supabase client

const EmployeeDetail = () => {
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  // Fetch employee list
  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabase.from("employees").select("*");
      if (error) console.error("Error fetching employees:", error);
      else setEmployees(data);
    };
    fetchEmployees();
  }, []);

  // Filter function
  const filteredEmployees = employees.filter((emp) =>
    [emp.name, emp.employee_id, emp.designation]
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: "20px" }}>
      <Typography variant="h5" gutterBottom>
        Employee Detail
      </Typography>

      <TextField
        fullWidth
        variant="outlined"
        label="Search by Name, Employee ID or Designation"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ marginBottom: 2 }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: "#1565c0" }}>
            <TableRow>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Sr No.</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Employee Name</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Employee ID</TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: "bold" }}>Designation</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmployees.map((emp, index) => (
              <TableRow
                key={emp.id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => navigate(`/employee/${emp.id}`)}
style={{ cursor: "pointer", backgroundColor: "#f9f9f9" }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#eef")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#f9f9f9")}>

              
                <TableCell>{index + 1}</TableCell>
                <TableCell>{emp.name}</TableCell>
                <TableCell>{emp.employee_id}</TableCell>
                <TableCell>{emp.designation}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default EmployeeDetail;

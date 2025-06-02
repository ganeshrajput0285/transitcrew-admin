import React, { useEffect, useState, useRef } from "react";
import html2pdf from "html2pdf.js";
import {
  Typography,
  Paper,
  Grid,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
} from "@mui/material";
import { useParams } from "react-router-dom";
import supabase from "../supabaseClient";

const SingleEmployee = () => {
  const { id } = useParams(); // UUID from route
  const [employee, setEmployee] = useState(null);
  const [duties, setDuties] = useState([]);
 const contentRef = useRef();

const handleDownload = () => {
  if (!contentRef.current) return;

  const images = contentRef.current.querySelectorAll("img");
  const imageLoadPromises = Array.from(images).map((img) => {
    return new Promise((resolve) => {
      if (img.complete) resolve(); // already loaded
      else img.onload = resolve; // wait for load
    });
  });

  Promise.all(imageLoadPromises).then(() => {
    const opt = {
      margin: 0.5,
      filename: `${employee?.name || "employee"}_details.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2,
useCORS: true, // <-- enables loading images from external URLs
      },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };

    html2pdf().set(opt).from(contentRef.current).save();
  });
};


  useEffect(() => {
    const fetchData = async () => {
      // Step 1: Get employee by UUID
      const { data: empData, error: empError } = await supabase
        .from("employees")
        .select("*")
        .eq("id", id)
        .single();

      if (empError) {
        console.error("Employee fetch error:", empError);
        return;
      }

      setEmployee(empData);

      // Step 2: Get duties for this employee_id
      const empId = empData.employee_id;
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);

      const fromDate = sevenDaysAgo.toISOString().split("T")[0];
      const toDate = today.toISOString().split("T")[0];

      const { data: dutyData, error: dutyError } = await supabase
        .from("final_roster")
        .select("*")
        .eq("employee_id", empId)
        .gte("saved_date", fromDate)
        .lte("saved_date", toDate)
        .order("saved_date", { ascending: false });

      if (dutyError) {
        console.error("Duty fetch error:", dutyError);
      } else {
        setDuties(dutyData);
      }
    };

    fetchData();
  }, [id]);

  if (!employee) return <Typography>Loading...</Typography>;

  return (
    <Paper ref={contentRef} elevation={3} sx={{ padding: 4, margin: 4 }}>
<Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
  <Grid item>
    <Typography variant="h5">Employee Details</Typography>
  </Grid>
  <Grid item>
    <button
      onClick={handleDownload}
      style={{
        backgroundColor: "#1976d2",
        color: "white",
        border: "none",
        padding: "8px 16px",
        borderRadius: "4px",
        cursor: "pointer",
      }}
    >
      Download PDF
    </button>
  </Grid>
</Grid>


      {/* Top - Photo + Name + ID */}
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <Avatar
            src={employee.photo_url}
            alt={employee.name}
            sx={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover" }}
imgProps={{ crossOrigin: "anonymous" }}
          />
        </Grid>
        <Grid item>
          <Typography variant="h6">{employee.name}</Typography>
          <Typography variant="body1">Employee ID: {employee.employee_id}</Typography>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Middle Info Section */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Typography><strong>Designation:</strong> {employee.designation}</Typography>
          <Typography><strong>DOB:</strong> {employee.dob}</Typography>
          <Typography><strong>DOJ:</strong> {employee.doj}</Typography>
          <Typography><strong>Permanent Address:</strong> {employee.permanent_address}</Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography><strong>Mobile Number:</strong> {employee.mobile}</Typography>
          <Typography><strong>Residential Address:</strong> {employee.residential_address}</Typography>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Duty Records */}
      <Typography variant="h6" gutterBottom>
        Last 7 Days Duty
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: "#1976d2" }}>
            <TableRow>
              <TableCell sx={{ color: "#fff" }}><strong>Date</strong></TableCell>
              <TableCell sx={{ color: "#fff" }}><strong>Duty Number</strong></TableCell>
              <TableCell sx={{ color: "#fff" }}><strong>Sign-On Time</strong></TableCell>
<TableCell sx={{ color: "#fff" }}><strong>Sign-On Location</strong></TableCell>
              <TableCell sx={{ color: "#fff" }}><strong>Sign-Off Time</strong></TableCell>
              
              <TableCell sx={{ color: "#fff" }}><strong>Sign-Off Location</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {duties.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>No duty records found.</TableCell>
              </TableRow>
            ) : (
              duties.map((duty) => (
                <TableRow key={duty.id}>
                  <TableCell>{new Date(duty.saved_date).toLocaleDateString("en-GB")}</TableCell>

                  <TableCell>{duty.duty_no}</TableCell>
                  <TableCell>{duty.sign_on_time}</TableCell>
                 <TableCell>{duty.sign_on_location}</TableCell>
                  <TableCell>{duty.sign_off_time}</TableCell>
                 
                  <TableCell>{duty.sign_off_location}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default SingleEmployee;

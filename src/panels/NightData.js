import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";

import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  TextField,
  Collapse,
  Button, MenuItem, Select, FormControl, InputLabel, Grid
} from "@mui/material";
import { supabase } from "../supabaseClient";

const NIGHT_ALLOWANCES = [
  {
    label: "SignOn before 02:00 / SignOff after 01:00",
    rate: 175,
    start: 21 * 60,
    end: 2 * 60,
  },
  {
    label: "SignOn before 03:00 / SignOff after 00:00",
    rate: 140,
    start: 2 * 60 + 1,
    end: 3 * 60,
  },
  {
    label: "SignOn before 04:00 / SignOff after 23:00",
    rate: 120,
    start: 3 * 60 + 1,
    end: 4 * 60,
  },
  {
    label: "SignOn before 05:00 / SignOff after 23:00",
    rate: 90,
    start: 4 * 60 + 1,
    end: 5 * 60,
  },
];

// Check if time is in range, considering overnight wrap
function isInRange(time, start, end) {
  if (start > end) {
    // crosses midnight
    return time >= start || time <= end;
  }
  return time >= start && time <= end;
}

// Convert Date to minutes from midnight
function timeToMinutes(date) {
  return date.getHours() * 60 + date.getMinutes();
}

// Match a record by checking if signOn or signOff time matches any tier
function matchNightAllowance(record) {
  if (!record.sign_on_actual_time || !record.sign_off_actual_time) {
    return [0, 0, 0, 0];
  }

  const signOn = new Date(record.sign_on_actual_time);
  const signOff = new Date(record.sign_off_actual_time);

  if (isNaN(signOn.getTime()) || isNaN(signOff.getTime())) {
    return [0, 0, 0, 0];
  }

  const signOnMinutes = timeToMinutes(signOn);
  const signOffMinutes = timeToMinutes(signOff);

  for (let i = 0; i < NIGHT_ALLOWANCES.length; i++) {
    const tier = NIGHT_ALLOWANCES[i];
    const signOnMatch = isInRange(signOnMinutes, tier.start, tier.end);
    const signOffMatch = isInRange(signOffMinutes, tier.start, tier.end);

    if (signOnMatch || signOffMatch) {
      const res = [0, 0, 0, 0];
      res[i] = 1;
      return res;
    }
  }

  return [0, 0, 0, 0];
}


// Compute night allowance breakdown and total for an employee
function computeNightData(empId, records) {
  const empRecords = records.filter((r) => r.employee_id === empId);
  let breakdown = [0, 0, 0, 0];

  empRecords.forEach((record) => {
    const match = matchNightAllowance(record);
    match.forEach((val, idx) => {
      if (val > 0) breakdown[idx] += val;
    });
  });

  const total = breakdown.reduce(
    (sum, count, idx) => sum + count * NIGHT_ALLOWANCES[idx].rate,
    0
  );

  return { breakdown, total, records: empRecords };
}

export default function NightData() {
  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [expanded] = useState({});
 
  const navigate = useNavigate();
const [selectedMonth, setSelectedMonth] = useState(null);
const [downloadType, setDownloadType] = useState("both");

function handleDownload() {
  const doc = new jsPDF();
  const monthStr = selectedMonth.format("MMMM YYYY");

  const filtered = employees
    .filter((emp) => {
      if (downloadType === "ta" && !emp.designation.toLowerCase().includes("ta")) return false;
      if (downloadType === "to" && !emp.designation.toLowerCase().includes("to")) return false;
      return true;
    })
    .map((emp) => {
      const { breakdown, total } = computeNightData(
        emp.employee_id,
        records.filter((r) => {
          const date = new Date(r.sign_on_actual_time);
          return (
            date.getMonth() === selectedMonth.month() &&
            date.getFullYear() === selectedMonth.year()
          );
        })
      );
      return {
        name: emp.name,
        employee_id: emp.employee_id,
        designation: emp.designation,
        breakdown,
        total,
      };
    });

  const header = [
    "Name",
    "Employee ID",
    "Designation",
    ...NIGHT_ALLOWANCES.map((a) => a.label),
    "Total ",
  ];

  const rows = filtered.map((emp) => [
    emp.name,
    emp.employee_id,
    emp.designation,
    ...emp.breakdown,
    `${emp.total}`,
  ]);

  const totalSum = filtered.reduce((sum, emp) => sum + emp.total, 0);
  rows.push([
    { content: "Total", colSpan: 3, styles: { halign: "right", fontStyle: "bold" } },
    ...Array(NIGHT_ALLOWANCES.length).fill(""),
    { content: `${totalSum}`, styles: { fontStyle: "bold" } },
  ]);

  doc.text(`Night Allowance Report - ${monthStr}`, 14, 20);
  autoTable(doc, {
    head: [header],
    body: rows,
    startY: 30,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [22, 160, 133] },
  });

  doc.save(`TransitCrew_Night_Allowance_Report_${monthStr}.pdf`);
}


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: empData, error: empError } = await supabase.from("employees").select("*");
    if (empError) {
      console.error("Error fetching employees:", empError);
    }

    const { data: signData, error: signError } = await supabase.from("sign_on_off_records").select("*");
    if (signError) {
      console.error("Error fetching sign records:", signError);
    }

    setEmployees(empData || []);
    setRecords(signData || []);
  };

  const filtered = employees.filter((emp) => {
    const q = search.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.designation.toLowerCase().includes(q) ||
      emp.employee_id.toLowerCase().includes(q)
    );
  });

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Night Allowance Data
      </Typography>
      <TextField
        fullWidth
        label="Search by Name, Designation, or Employee ID"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3 }}
      />
<LocalizationProvider dateAdapter={AdapterDayjs}>
  <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
    <Grid item xs={12} sm={4}>
      <DatePicker
        views={["year", "month"]}
        label="Select Month"
        value={selectedMonth}
        onChange={(newValue) => setSelectedMonth(newValue)}
        renderInput={(params) => <TextField {...params} fullWidth />}
      />
    </Grid>
    <Grid item xs={12} sm={4}>
      <FormControl fullWidth>
        <InputLabel>Type</InputLabel>
        <Select
          value={downloadType}
          label="Type"
          onChange={(e) => setDownloadType(e.target.value)}
        >
          <MenuItem value="to">TO</MenuItem>
          <MenuItem value="ta">TA</MenuItem>
          <MenuItem value="both">Both</MenuItem>
        </Select>
      </FormControl>
    </Grid>
    <Grid item xs={12} sm={4}>
      <Button
        fullWidth
        variant="contained"
        color="primary"
        onClick={handleDownload}
        disabled={!selectedMonth}
      >
        Download Report
      </Button>
    </Grid>
  </Grid>
</LocalizationProvider>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "lightgrey" }}>
             
              <TableCell><strong>Name</strong></TableCell>
              <TableCell><strong>Employee ID</strong></TableCell>
              <TableCell><strong>Designation</strong></TableCell>
              {NIGHT_ALLOWANCES.map((col) => (
                <TableCell key={col.label}><strong>{col.label}</strong></TableCell>
              ))}
              <TableCell><strong>Total (₹)</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((emp) => {
              const { breakdown, total, records: empRecords } = computeNightData(emp.employee_id, records);
              return (
                <React.Fragment key={emp.employee_id}>
                   <TableRow
            key={emp.id}
           onClick={() => navigate(`/night-data/${emp.employee_id}`)}


            style={{ cursor: "pointer", backgroundColor: "#f9f9f9" }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#eef")}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#f9f9f9")}>

          
                    <TableCell>{emp.name}
</TableCell>
                    <TableCell>{emp.employee_id}</TableCell>
                    <TableCell>{emp.designation}</TableCell>
                    {breakdown.map((count, i) => (
                      <TableCell key={i}>{count}</TableCell>
                    ))}
                    <TableCell>₹{total}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={7 + NIGHT_ALLOWANCES.length} sx={{ p: 0 }}>
                      <Collapse in={expanded[emp.employee_id]} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, bgcolor: "#f9f9f9" }}>
                          <Typography variant="subtitle2" gutterBottom>
                            Sign-On / Sign-Off Records
                          </Typography>
                          {empRecords.length === 0 ? (
                            <Typography variant="body2">No records found.</Typography>
                          ) : (
                            empRecords.map((r, idx) => (
                              <Typography key={idx} variant="body2">
                                Sign-On: {new Date(r.sign_on_actual_time).toLocaleString()} | Sign-Off:{" "}
                                {new Date(r.sign_off_actual_time).toLocaleString()}
                              </Typography>
                            ))
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

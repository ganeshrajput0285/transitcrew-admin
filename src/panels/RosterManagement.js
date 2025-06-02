import React, { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import supabase from "../supabaseClient";
import {
  Container,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";


function RosterManagement() {
  const [file, setFile] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [filteredSchedule, setFilteredSchedule] = useState([]);
  const [editIndex, setEditIndex] = useState(null);
  const [editedRow, setEditedRow] = useState({});
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
 const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef(null);

  const normalizeHeaders = (row) => {
    const map = {
      "employee id": "employee_id",
      empid: "employee_id",
      id: "employee_id",
      "duty no": "duty_no",
      "sign on time": "sign_on_time",
      "sign on location": "sign_on_location",
      "sign off time": "sign_off_time",
      "sign off location": "sign_off_location",
      "employee name": "employee_name",
      name: "employee_name",
    };

    const normalized = {};
    for (const key in row) {
      const cleanedKey = key.trim().toLowerCase();
      const mappedKey = map[cleanedKey] || null;
      if (mappedKey) normalized[mappedKey] = row[key];
    }
    return normalized;
  };

  useEffect(() => {
    const fetchRoster = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("roster_schedule").select("*");
      if (error) {
        console.error("❌ Error loading roster:", error);
        alert("Failed to load roster.");
      } else {
        setSchedule(data);
        setFilteredSchedule(data);
      }
      setLoading(false);
    };

    fetchRoster();
  }, []);

  useEffect(() => {
    const filtered = schedule.filter((row) => {
      return (
        row.employee_id.toString().includes(searchQuery) ||
        row.employee_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
    setFilteredSchedule(filtered);
  }, [searchQuery, schedule]);

  const handleDownloadPDF = async () => {
    const formattedDate = selectedDate;
    const startOfDay = `${formattedDate}T00:00:00.000Z`;
    const endOfDay = `${formattedDate}T23:59:59.999Z`;
    


    console.log("Fetching data for date:", formattedDate);
    console.log("Start of Day:", startOfDay);
    console.log("End of Day:", endOfDay);

  const { data, error } = await supabase
    .from("final_roster")
    .select("*")
    .gte("saved_date", startOfDay)
      .lt("saved_date", endOfDay);



  if (error || !data || data.length === 0) {
    alert("❌ No roster found for this date.");
    console.error("Download error:", error);
    return;
  }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("TransitCrew Roster", 14, 22);
    doc.setFontSize(12);
    doc.setTextColor(150);
    doc.text("Downloaded on: " + new Date().toLocaleString(), 14, 30);

    autoTable(doc, {
      startY: 40,
      head: [["Employee ID", "Name", "Duty No", "Sign-On Time", "Sign-On Location", "Sign-Off Time", "Sign-Off Location"]],
      body: data.map((row) => [
        row.employee_id,
        row.employee_name,
        row.duty_no,
        row.sign_on_time,
        row.sign_on_location,
        row.sign_off_time,
        row.sign_off_location,
      ]),
      styles: { halign: "center" },
      headStyles: { fillColor: [33, 150, 243] },
    });

    // Add watermark
    doc.setTextColor(240);
    doc.setFontSize(60);
    doc.text("TransitCrew", 70, 150, { angle: 45, opacity: 0.1 });

    doc.save(`TransitCrew_Roster_${selectedDate}.pdf`);
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(sheet);
        const parsedData = rawData.map(normalizeHeaders);

        const cleanData = parsedData.filter(
          (row) =>
            row.employee_id &&
            row.employee_name &&
            row.duty_no &&
            row.sign_on_time
        );

        const { error } = await supabase.from("roster_schedule").insert(cleanData);

        if (error) {
          console.error("❌ Upload error:", error);
          alert("❌ Failed to upload roster.");
        } else {
          alert("✅ Roster uploaded successfully!");
          setSchedule((prev) => [...prev, ...cleanData]);
          setFilteredSchedule((prev) => [...prev, ...cleanData]);
        }
      };
      reader.readAsArrayBuffer(uploadedFile);
    }
  };

  const handleRemoveFile = async () => {
    if (schedule.length === 0) return;

    const employeeIds = schedule.map((row) => row.employee_id);
    const { error } = await supabase
      .from("roster_schedule")
      .delete()
      .in("employee_id", employeeIds);

    if (error) {
      console.error("❌ Error deleting:", error);
      alert("❌ Failed to delete roster.");
    } else {
      alert("✅ Roster deleted from Supabase.");
      setSchedule([]);
      setFilteredSchedule([]);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = null;
    }
  };

  const handleEdit = (index) => {
    setEditIndex(index);
    setEditedRow({ ...filteredSchedule[index] });
  };

  const handleEditChange = (field, value) => {
    setEditedRow((prev) => ({ ...prev, [field]: value }));
    if (field === "employee_id") fetchEmployeeName(value);
  };

  const fetchEmployeeName = async (empId) => {
    const { data, error } = await supabase
      .from("employees")
      .select("name")
      .eq("employee_id", empId)
      .single();

    if (error || !data) {
      setEditedRow((prev) => ({ ...prev, employee_name: "" }));
    } else {
      setEditedRow((prev) => ({ ...prev, employee_name: data.name }));
    }
  };

  const handleCancelEdit = () => {
    setEditIndex(null);
    setEditedRow({});
  };

  const handleSaveEdit = async (index) => {
    const originalRow = filteredSchedule[index];
    const updatedRow = editedRow;

    if (originalRow.employee_id !== updatedRow.employee_id) {
      const { error: deleteError } = await supabase
        .from("roster_schedule")
        .delete()
        .eq("employee_id", originalRow.employee_id);

      if (deleteError) {
        console.error("❌ Delete error:", deleteError);
        alert("❌ Failed to update row.");
        return;
      }

      const { error: insertError } = await supabase
        .from("roster_schedule")
        .insert([updatedRow]);

      if (insertError) {
        console.error("❌ Insert error:", insertError);
        alert("❌ Failed to update row.");
        return;
      }
    } else {
      const { error } = await supabase
        .from("roster_schedule")
        .update(updatedRow)
        .eq("employee_id", updatedRow.employee_id);

      if (error) {
        console.error("❌ Update error:", error);
        alert("❌ Failed to update row.");
        return;
      }
    }

    const updatedSchedule = [...filteredSchedule];
    updatedSchedule[index] = updatedRow;
    setFilteredSchedule(updatedSchedule);
    setEditIndex(null);
    setEditedRow({});
    alert("✅ Row updated successfully!");
  };
// New function to move data from roster_schedule to final_roster
  const handleChange = async () => {
    setLoading(true);

    // Insert all the data from roster_schedule into final_roster table
    const { data, error } = await supabase
      .from("roster_schedule")
      .select("*");

    if (error) {
      console.error("❌ Error fetching roster schedule:", error);
      alert("Failed to move roster data.");
      setLoading(false);
      return;
    }

    const moveData = data.map((row) => ({
      employee_id: row.employee_id,
      employee_name: row.employee_name,
      duty_no: row.duty_no,
      sign_on_time: row.sign_on_time,
      sign_on_location: row.sign_on_location,
      sign_off_time: row.sign_off_time,
      sign_off_location: row.sign_off_location,
    }));

    const { error: insertError } = await supabase
      .from("final_roster")
      .insert(moveData);

    if (insertError) {
      console.error("❌ Error moving data to final roster:", insertError);
      alert("Failed to move roster data.");
    } else {
      alert("✅ Roster data moved to final roster!");
      const { error: deleteError } = await supabase
        .from("roster_schedule")
        .delete()
        .neq("employee_id", "");

      if (deleteError) {
        console.error("❌ Error deleting roster schedule:", deleteError);
        alert("❌ Failed to clear roster schedule.");
      } else {
        setSchedule([]);
        setFilteredSchedule([]);
      }
    }

    setLoading(false);
  };

  return (
    <Container sx={{ marginTop: 4 }}>
      <Typography variant="h4" gutterBottom>
        Roster Management
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <TextField
          label="Search by Employee ID or Name"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
        />
        
        <Button variant="contained" onClick={() => setIsDialogOpen(true)}>
          Download
        </Button>
      </Box>

      {!file && (
        <Button variant="contained" component="label">
          Upload Excel File
          <input
            type="file"
            accept=".xlsx, .xls"
            hidden
            onChange={handleFileUpload}
            ref={fileInputRef}
          />
        </Button>
      )}

      {file && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
          <Typography>📄 {file.name}</Typography>
          <Button variant="outlined" onClick={handleRemoveFile}>
            Remove
          </Button>
          <Button
            variant="contained" component="label">
            Change
             <input
               type="file"
               accept=".xlsx, .xls"
                 hidden
               onChange={handleFileUpload}
               ref={fileInputRef}
             />
          </Button>
        </Box>
      )}

      {loading ? (
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <CircularProgress />
        </Box>
      ) : (
        filteredSchedule.length > 0 && (
          <Table sx={{ marginTop: 4 }}>
            <TableHead>
              <TableRow>
                <TableCell><b>Employee ID</b></TableCell>
                <TableCell><b>Name</b></TableCell>
                <TableCell><b>Duty No</b></TableCell>
                <TableCell><b>Sign-On Time</b></TableCell>
                <TableCell><b>Sign-On Location</b></TableCell>
                <TableCell><b>Sign-Off Time</b></TableCell>
                <TableCell><b>Sign-Off Location</b></TableCell>
                <TableCell><b>Action</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSchedule.map((row, index) => (
                <TableRow key={index}>
                  {editIndex === index ? (
                    <>
                      <TableCell>
                        <TextField
                          value={editedRow.employee_id}
                          onChange={(e) =>
                            handleEditChange("employee_id", e.target.value)
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={editedRow.employee_name}
                          disabled
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={editedRow.duty_no}
                          onChange={(e) =>
                            handleEditChange("duty_no", e.target.value)
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={editedRow.sign_on_time}
                          onChange={(e) =>
                            handleEditChange("sign_on_time", e.target.value)
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={editedRow.sign_on_location}
                          onChange={(e) =>
                            handleEditChange("sign_on_location", e.target.value)
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={editedRow.sign_off_time}
                          onChange={(e) =>
                            handleEditChange("sign_off_time", e.target.value)
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          value={editedRow.sign_off_location}
                          onChange={(e) =>
                            handleEditChange("sign_off_location", e.target.value)
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button onClick={() => handleSaveEdit(index)} color="success">
                          Save
                        </Button>
                        <Button onClick={handleCancelEdit} color="error">
                          Cancel
                        </Button>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>{row.employee_id}</TableCell>
                      <TableCell>{row.employee_name}</TableCell>
                      <TableCell>{row.duty_no}</TableCell>
                      <TableCell>{row.sign_on_time}</TableCell>
                      <TableCell>{row.sign_on_location}</TableCell>
                      <TableCell>{row.sign_off_time}</TableCell>
                      <TableCell>{row.sign_off_location}</TableCell>
                      <TableCell>
                        <Button onClick={() => handleEdit(index)}>Edit</Button>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )
      )}
 {schedule.length > 0 && (
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <Button variant="contained" onClick={handleChange}>
            Move to Final Roster
          </Button>
        </Box>
      )}

     <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>Select Date to Download PDF</DialogTitle>
        <DialogContent>
           <TextField
             type="date"
             fullWidth
             value={selectedDate}
              onChange={handleDateChange}
             InputLabelProps={{ shrink: true }}
           />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleDownloadPDF}>Download</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default RosterManagement;


import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import {
  Dialog, DialogActions, DialogContent, DialogTitle,
  Button, TextField, IconButton, Avatar, Table, TableHead,
  TableBody, TableCell, TableRow, TableContainer, Paper, Typography
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

function EmployeesSection() {
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editData, setEditData] = useState(null);
const [authPromptVisible, setAuthPromptVisible] = useState(false);
const [adminPassword, setAdminPassword] = useState("");
const [authError, setAuthError] = useState("");
const [pendingAction, setPendingAction] = useState(null); // { type: "edit" | "delete", payload: any }


  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const { data, error } = await supabase.from("employees").select("*");
    if (!error) setEmployees(data);
  };

 const handleRemove = (id) => {
  setPendingAction({ type: "delete", payload: id });
  setAuthPromptVisible(true);
};

  const handleEditOpen = (emp) => {
  setPendingAction({ type: "edit", payload: emp });
  setAuthPromptVisible(true);
};

const handleVerifyPassword = async () => {
  const user = await supabase.auth.getUser();
  const email = user?.data?.user?.email;

  if (!email) {
    setAuthError("User not authenticated.");
    return;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: adminPassword,
  });

  if (error) {
    setAuthError("❌ Incorrect password.");
    return;
  }

  // Auth successful – proceed based on pendingAction
  if (pendingAction?.type === "edit") {
    setEditData(pendingAction.payload);
  } else if (pendingAction?.type === "delete") {
    const id = pendingAction.payload;

  const confirmDelete = window.confirm("Are you sure you want to remove this employee?");
  if (!confirmDelete) {
    // Cancel the action if user says "Cancel"
    setPendingAction(null);
    return;
  }

    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (!error) {
      setEmployees((prev) => prev.filter(emp => emp.id !== id));
      alert("✅ Employee removed.");
    } else {
      alert("❌ Failed to remove employee.");
    }
  }

  // Cleanup
  setAuthPromptVisible(false);
  setAdminPassword("");
  setAuthError("");
  setPendingAction(null);
};


  const handleEditChange = (field, value) => {
    setEditData({ ...editData, [field]: value });
  };

  const handleEditSave = async () => {
    const { id, ...updatedFields } = editData;
    const { error } = await supabase.from("employees").update(updatedFields).eq("id", id);
    if (!error) {
      fetchEmployees();
      setEditData(null);
    } else {
      alert("Failed to update employee");
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: "20px" }}>
      <Typography variant="h4" gutterBottom>Approved Employees</Typography>
      <TextField
        fullWidth
        label="Search by Employee ID or Name"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
      />

      {filteredEmployees.length === 0 ? (
        <Typography>No employees found</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
              <TableRow>
                <TableCell><strong>Photo</strong></TableCell>
                <TableCell><strong>Employee ID</strong></TableCell>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Designation</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmployees.map(emp => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <a href={emp.photo_url} target="_blank" rel="noopener noreferrer">
                      <Avatar
                        src={emp.photo_url}
                        alt={emp.name}
                        sx={{ width: 56, height: 56, cursor: "pointer" }}
                      />
                    </a>
                  </TableCell>
                  <TableCell>{emp.employee_id}</TableCell>
                  <TableCell>{emp.name}</TableCell>
                  <TableCell>{emp.designation}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEditOpen(emp)}>
                      <EditIcon color="primary" />
                    </IconButton>
                    <IconButton onClick={() => handleRemove(emp.id)}>
                      <DeleteIcon color="error" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

<Dialog open={authPromptVisible} onClose={() => setAuthPromptVisible(false)}>
  <DialogTitle>Admin Password Required</DialogTitle>
  <DialogContent>
    <TextField
      type="password"
      label="Enter Admin Password"
      fullWidth
      value={adminPassword}
      onChange={(e) => setAdminPassword(e.target.value)}
      error={!!authError}
      helperText={authError}
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setAuthPromptVisible(false)}>Cancel</Button>
    <Button variant="contained" onClick={handleVerifyPassword}>Verify</Button>
  </DialogActions>
</Dialog>


      {/* Edit Modal */}
      {editData && (
        <Dialog open={true} onClose={() => setEditData(null)}>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="Name"
              fullWidth
              value={editData.name || ""}
              onChange={(e) => handleEditChange("name", e.target.value)}
            />
            <TextField
              margin="dense"
              label="Designation"
              fullWidth
              value={editData.designation || ""}
              onChange={(e) => handleEditChange("designation", e.target.value)}
            />
            <TextField
              margin="dense"
              label="Mobile"
              fullWidth
              value={editData.mobile || ""}
              onChange={(e) => handleEditChange("mobile", e.target.value)}
            />
            <TextField
              margin="dense"
              label="Permanent Address"
              fullWidth
              value={editData.permanent_address || ""}
              onChange={(e) => handleEditChange("permanent_address", e.target.value)}
            />
            <TextField
              margin="dense"
              label="Residential Address"
              fullWidth
              value={editData.residential_address || ""}
              onChange={(e) => handleEditChange("residential_address", e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditData(null)}>Cancel</Button>
            <Button variant="contained" onClick={handleEditSave}>Save</Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
}

export default EmployeesSection;

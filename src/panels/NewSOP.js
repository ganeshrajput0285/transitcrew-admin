import React, { useEffect, useState, useRef } from "react";
import {
  Button,
  Container,
  Typography,
  TextField,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from "@mui/material";
import ImageIcon from "@mui/icons-material/Image";
import DeleteIcon from "@mui/icons-material/Delete";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../supabaseClient"; // Adjust path as needed

const SOPManagement = () => {
  const [sopList, setSopList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate(); // Use history for navigation

  // Fetch existing SOPs from Supabase on component mount
  useEffect(() => {
    const fetchSOPs = async () => {
      const { data, error } = await supabase
        .from("sop_documents")
        .select("*")
        .order("uploaded_at", { ascending: false }); // Sort by latest

      if (error) {
        console.error("Error fetching SOPs:", error);
      } else {
        setSopList(data);
      }
    };

    fetchSOPs();
  }, []);

  // Handle file upload
  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uploads = Array.from(files).map(async (file) => {
      const filePath = `${Date.now()}_${file.name}`;

      // Step 1: Upload the file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("sops")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        return null;
      }

      // Step 2: Get the public URL of the uploaded file
      const { data: publicURLData } = supabase.storage
        .from("sops")
        .getPublicUrl(filePath);

      // Step 3: Prepare metadata to insert into the sop_documents table
      const metadata = {
        name: file.name,
        uploaded_at: new Date().toISOString(),
        file_type: file.type,
        file_path: filePath,
        document_url: publicURLData.publicUrl,
        target_employees: "all", // You can modify this based on specific employee assignment
      };

      // Step 4: Insert metadata into sop_documents table
      const { data: insertedData, error: insertError } = await supabase
        .from("sop_documents")
        .insert([metadata])
        .select(); // Return inserted row to check the inserted data

      if (insertError) {
        console.error("Insert error:", insertError);
        return null;
      }

      // Return the inserted data
      return insertedData[0];
    });

    // Step 5: Update state to reflect the uploaded SOPs
    const uploaded = await Promise.all(uploads);
    const successful = uploaded.filter(Boolean);
    setSopList((prev) => [...successful, ...prev]); // Add to top of list
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const renderFileIcon = (fileType) => {
    if (fileType.includes("image")) return <ImageIcon />;
    if (fileType.includes("pdf")) return <InsertDriveFileIcon />;
    return <InsertDriveFileIcon />;
  };

  const filteredList = sopList.filter(
    (sop) =>
      sop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sop.uploaded_at.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle SOP document click
  const handleSopClick = (sopId, sopName) => {
    navigate(`/sop-details/${sopId}/${sopName}`);
  };

const handleDeleteSop = async (id, filePath) => {
 if (!filePath) {
    console.error("Missing file path, cannot delete");
    return;
  }


  const confirmed = window.confirm("Are you sure you want to delete this SOP and its file?");
  if (!confirmed) return;

  try {
    // 1. Delete the file from Supabase Storage
    const { error: storageError } = await supabase
      .storage
      .from("sops") // 🔁 replace with your actual bucket name
      .remove([filePath]);

    if (storageError) {
      console.error("Failed to delete file from storage:", storageError.message);
      return;
    }

    // 2. Delete the record from the table
    const { error: dbError } = await supabase
      .from("sop_documents") // 🔁 replace with your table name
      .delete()
      .eq("id", id);

    if (dbError) {
      console.error("Failed to delete SOP record:", dbError.message);
      return;
    }

    // 3. Remove it from UI
    setSopList(prev => prev.filter((item) => item.id !== id));
    alert("SOP and file deleted successfully!");
  } catch (err) {
    console.error("Unexpected error:", err);
  }
};


  return (
    <Container sx={{ marginTop: 4 }}>
      <Typography variant="h4" gutterBottom>
        Documents
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <TextField
          label="Search by File Name or Date"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
        />
        <Button variant="contained" onClick={triggerFileSelect}>
          Upload
        </Button>
        <input
          type="file"
          multiple
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleUpload}
        />
      </Box>

      {sopList.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>File</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Uploaded At</TableCell>
                <TableCell><strong>Action</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} align="center">
                    No SOPs match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredList.map((sop, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Link to={`/sop-details/${sop.id}/${sop.name}`}>
                        <IconButton onClick={() => handleSopClick(sop.id, sop.name)}>
                          {renderFileIcon(sop.file_type)}
                        </IconButton>
                        {sop.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {new Date(sop.uploaded_at).toLocaleString()}
                    </TableCell>
                     <TableCell>
        <IconButton
          aria-label="delete"
          color="error"
         onClick={() => {
      if (sop.file_path) {
        handleDeleteSop(sop.id, sop.file_path);
      } else {
        console.error("Missing file path for deletion:", sop);
        alert("Cannot delete file: file path is missing.");
      }
    }}
  >
          <DeleteIcon />
        </IconButton>
      </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default SOPManagement;

import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Table,
  TextField,
  Box,
  Button,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import { useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { PDFDocument } from "pdf-lib";

const SopDetails = () => {
  const { sopId, sopName } = useParams();
  const [employeeList, setEmployeeList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSopData = async () => {
      try {
        // 1. Fetch the list of employees
        const { data: allEmployees, error: employeeError } = await supabase
          .from("employees")
          .select("employee_id, name, designation");

        if (employeeError) {
          console.error("Error fetching employee data:", employeeError);
          setLoading(false);
          return;
        }

        // 2. Fetch the acknowledgment logs for this SOP document
        const { data: acknowledgmentLogs, error: acknowledgmentError } = await supabase
          .from("acknowledgment_logs")
          .select("employee_id, acknowledged, timestamp")
          .eq("sop_document_id", sopId); // Match the SOP ID

        if (acknowledgmentError) {
          console.error("Error fetching acknowledgment logs:", acknowledgmentError);
          setLoading(false);
          return;
        }

        // 3. Map acknowledgment logs into a map for easy lookup
        const acknowledgmentMap = new Map(
          acknowledgmentLogs.map((log) => [log.employee_id, log])
        );

        // 4. Merge employee data with acknowledgment data
        const mergedData = allEmployees.map((emp) => {
          const acknowledgment = acknowledgmentMap.get(emp.employee_id);
          return {
            ...emp,
            acknowledged: acknowledgment ? acknowledgment.acknowledged : false,
            acknowledgment_time: acknowledgment ? acknowledgment.timestamp : null,
          };
        });

        setEmployeeList(mergedData);
        setLoading(false);
      } catch (e) {
        console.error("Unexpected error:", e);
        setLoading(false);
      }
    };

    fetchSopData();
  }, [sopId]);

  const formatAcknowledgmentDate = (date) =>
    date ? new Date(date).toLocaleString() : "Pending";

  const filteredEmployees = employeeList.filter((emp) =>
    emp.employee_id.toString().includes(searchQuery) ||
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.designation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDownload = async () => {
    try {
      const { data: sopData, error } = await supabase
        .from("sop_documents")
        .select("document_url, name")
        .eq("id", sopId)
        .single();

      if (error || !sopData?.document_url) {
        console.error("Failed to fetch SOP URL", error);
        return;
      }

      // 1. Fetch SOP file
      const response = await fetch(sopData.document_url);
      const fileBytes = await response.arrayBuffer();
      const contentType = response.headers.get("Content-Type");

      // 2. Create main PDF
      const finalPdf = await PDFDocument.create();

      // 3. Embed SOP file
      if (contentType.includes("pdf")) {
        const uploadedPdf = await PDFDocument.load(fileBytes);
        const pages = await finalPdf.copyPages(uploadedPdf, uploadedPdf.getPageIndices());
        pages.forEach(page => finalPdf.addPage(page));
      } else if (contentType.includes("image")) {
        const image = contentType.includes("png")
          ? await finalPdf.embedPng(fileBytes)
          : await finalPdf.embedJpg(fileBytes);
        const page = finalPdf.addPage([image.width, image.height]);
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      } else {
        console.error("Unsupported file type:", contentType);
        return;
      }

      // 4. Create Acknowledgment PDF using jsPDF
      const tempDoc = new jsPDF("p", "mm", "a4");

      // Header
      tempDoc.setDrawColor(200, 0, 0);
      tempDoc.setLineWidth(0.5);
      tempDoc.rect(188, 8, 12, 8);
      tempDoc.setFont("Helvetica", "bold");
      tempDoc.setFontSize(14);
      tempDoc.setTextColor(200, 0, 0);
      tempDoc.text("DB", 190, 13);

      tempDoc.setFont("Arial", "bold");
      tempDoc.setTextColor(79, 129, 189);
      tempDoc.setFontSize(12);
      tempDoc.text("DB RRTS Operations India Private Limited", 105, 15, { align: "center" });

      // Blue Title Bar
      tempDoc.setFillColor(79, 129, 189);
      tempDoc.setTextColor(255, 255, 255);
      tempDoc.setFontSize(14);
      tempDoc.rect(10, 20, 190, 10, "F");
      tempDoc.text("Document Assurance Form", 105, 28, { align: "center" });

      tempDoc.setTextColor(0);
      tempDoc.setFontSize(10);

      // Info Table
      tempDoc.setDrawColor(79, 129, 189);
      tempDoc.rect(10, 35, 40, 12);
      tempDoc.setTextColor(79, 129, 189);
      tempDoc.text("Document Name", 12, 42);
      tempDoc.rect(50, 35, 110, 12);
      tempDoc.text(sopName, 52, 42);
      tempDoc.rect(160, 35, 20, 12);
      tempDoc.text("Signature", 162, 42);

      tempDoc.rect(10, 47, 40, 12);
      tempDoc.text("Manager in charge\nof the distribution", 12, 52);
      tempDoc.rect(50, 47, 110, 12);
      tempDoc.rect(160, 47, 20, 12);

      // Paragraph
      tempDoc.setFontSize(10);
      tempDoc.text(
        "I hereby give my assurance to acknowledge, fully understand and abide by the content of the document.\nAny doubts have been cleared with my hierarchy (through group presentation or individual request).",
        12,
        65
      );

      // Watermark
      tempDoc.setFontSize(28);
      tempDoc.setTextColor(200, 200, 200);
      tempDoc.text("TransitCrew", 105, 250, { align: "center", angle: 45 });
      tempDoc.setTextColor(0);

      // Acknowledgement Table
      const tableData = filteredEmployees.map((emp, i) => [
        i + 1,
        emp.name,
        emp.employee_id,
        emp.designation,
        emp.acknowledged ? "digital signed" : "Pending",
        emp.acknowledged ? formatAcknowledgmentDate(emp.acknowledgment_time) : "",
      ]);

      autoTable(tempDoc, {
        startY: 85,
        head: [["Sr No", "Name of Employee", "Employee ID", "Designation", "Signature", "Date"]],
        body: tableData,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [79, 129, 189], textColor: 255 },
      });

      // 5. Convert jsPDF output to array buffer
      const jsPdfBytes = tempDoc.output("arraybuffer");
      const jsPdfDoc = await PDFDocument.load(jsPdfBytes);
      const jsPdfPages = await finalPdf.copyPages(jsPdfDoc, jsPdfDoc.getPageIndices());
      jsPdfPages.forEach(page => finalPdf.addPage(page));

      // 6. Download merged PDF
      const finalBytes = await finalPdf.save();
      const blob = new Blob([finalBytes], { type: "application/pdf" });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${sopName}_Merged_Acknowledgement.pdf`;
      link.click();
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  return (
    <Container sx={{ marginTop: 4 }}>
      <Typography variant="h4" gutterBottom>{sopName}</Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <TextField
          label="Search by Employee ID, Name or Designation"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
        />
        <Button variant="contained" onClick={handleDownload}>Download</Button>
      </Box>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Employee Name</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Employee ID</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Designation</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Acknowledgment Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEmployees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">No employee data available for this SOP.</TableCell>
                </TableRow>
              ) : (
                filteredEmployees.map((emp) => (
                  <TableRow key={emp.employee_id}>
                    <TableCell>{emp.name}</TableCell>
                    <TableCell>{emp.employee_id}</TableCell>
                    <TableCell>{emp.designation}</TableCell>
                    <TableCell>
                      {emp.acknowledged ? ` Digital Signed at ${formatAcknowledgmentDate(emp.acknowledgment_time)}` : "Pending"}
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

export default SopDetails;

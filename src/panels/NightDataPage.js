import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable'; 
import autoTable from 'jspdf-autotable';
import { useParams } from 'react-router-dom';
import { supabase } from "../supabaseClient";
import {
  Box,
  Typography,
  CircularProgress,
  Container,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
 Button, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker'; // if you're using MUI X
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';


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

function NightDataPage() {
  const { employeeId } = useParams();
  const [employeeName, setEmployeeName] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(null);
const [endDate, setEndDate] = useState(null);

  const [open, setOpen] = useState(false);

 
  const cleanId = employeeId.split(':')[0];


const handleDownload = () => {
  const filteredData = rows.filter(row => {
    const rowDate = dayjs(row.date, 'DD-MM-YYYY');
    return (
      rowDate.isSameOrAfter(dayjs(startDate), 'day') &&
      rowDate.isSameOrBefore(dayjs(endDate), 'day')
    );
  });

  if (filteredData.length === 0) {
    alert('No data available for the selected date range.');
    return;
  }

  const pdf = new jsPDF();
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();

  // Watermark
  pdf.setTextColor(200, 200, 200);
  pdf.setFontSize(50);
  pdf.text('TransitCrew', pdfWidth / 2, pdfHeight / 2, {
    align: 'center',
    angle: 45,
  });

  // Reset text color
  pdf.setTextColor(0);
  pdf.setFontSize(12);

  // Title and date range
pdf.setFontSize(16);
  const EName = employeeName || 'Unknown';
  const empID = employeeId || 'N/A';
  pdf.text(`${EName}`, 14, 20);

pdf.setFontSize(14);
 pdf.text(`${empID}`, 14, 26);

pdf.setFontSize(12);
 pdf.text(`Night Allowance Report`, 14, 32);

  pdf.text(`From ${dayjs(startDate).format('DD-MM-YYYY')} To ${dayjs(endDate).format('DD-MM-YYYY')}`, 14, 37);

  // Table
  autoTable(pdf, {
    startY: 42,
    head: [
      [
        { content: 'Date', rowSpan: 2 },
        { content: 'Duty No.', rowSpan: 2 },
        { content: 'Schedule', colSpan: 4, styles: { halign: 'center' } },
        { content: 'Actual', colSpan: 4, styles: { halign: 'center' } },
        { content: 'SignOn before 02:00 / SignOff after 01:00', rowSpan: 2 },
        { content: 'SignOn before 03:00 / SignOff after 00:00', rowSpan: 2 },
        { content: 'SignOn before 04:00 / SignOff after 23:00', rowSpan: 2 },
        { content: 'SignOn before 05:00 / SignOff after 23:00', rowSpan: 2 },
        { content: 'Total (₹)', rowSpan: 2 }
      ],
      [
        { content: 'Sign-On Time' },
        { content: 'Sign-On Location' },
        { content: 'Sign-Off Time' },
        { content: 'Sign-Off Location' },
        { content: 'Sign-On Time' },
        { content: 'Sign-On Location' },
        { content: 'Sign-Off Time' },
        { content: 'Sign-Off Location' }
      ]
    ],
    body: filteredData.map(row => [
      row.date,
      row.duty_number,
      row.sign_on_time,
      row.sign_on_location,
      row.sign_off_time,
      row.sign_off_location,
      row.sign_on_actual_time,
      row.sign_on_actual_location,
      row.sign_off_actual_time,
      row.sign_off_actual_location,
      row.allowance_1,
      row.allowance_2,
      row.allowance_3,
      row.allowance_4,
      row.total_amount,
    ]),
    styles: { fontSize: 6 },
    theme: 'striped',
    headStyles: { fillColor: [22, 160, 133] },
  });

  pdf.save(`TransitCrew_Night_Allowance_${dayjs().format('YYYY-MM-DD')}.pdf`);
}; 
   
useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('name')
          .eq('employee_id', cleanId)
          .single();
        if (employeeError) throw employeeError;
        setEmployeeName(employeeData.name);

        const { data: rosterData, error: rosterError } = await supabase
          .from('final_roster')
          .select('saved_date, sign_on_time, sign_off_time, duty_no, sign_on_location, sign_off_location')
          .eq('employee_id', cleanId);
        if (rosterError) throw rosterError;

        const { data: recordsData, error: recordsError } = await supabase
          .from('sign_on_off_records')
          .select('sign_on_actual_time, sign_off_actual_time, sign_on_actual_location, sign_off_actual_location')
          .eq('employee_id', cleanId);
        if (recordsError) throw recordsError;


        const mergedData = rosterData.map((roster) => {
          const dateObj = new Date(roster.saved_date);
const rosterDate = `${String(dateObj.getDate()).padStart(2, '0')}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${dateObj.getFullYear()}`;

         const savedDateObj = new Date(roster.saved_date);

const matchingRecord = recordsData
  .filter((record) => record.employee_id === roster.employee_id && record.sign_on_actual_time)
  .map((record) => {
    const actualDate = new Date(record.sign_on_actual_time);
    const diff = Math.abs(actualDate - savedDateObj);
    return { ...record, dateDiff: diff };
  })
  .sort((a, b) => a.dateDiff - b.dateDiff)[0]; // closest match


          const signOnActual = matchingRecord?.sign_on_actual_time
            ? new Date(matchingRecord.sign_on_actual_time)
            : null;
          const signOffActual = matchingRecord?.sign_off_actual_time
            ? new Date(matchingRecord.sign_off_actual_time)
            : null;

          const getMinutesFromMidnight = (date) =>
  date.getHours() * 60 + date.getMinutes();

const allowances = NIGHT_ALLOWANCES.map(({ start, end }) => {
  if (!signOnActual || !signOffActual) return 0;

  const signOnMinutes = getMinutesFromMidnight(signOnActual);
  const signOffMinutes = getMinutesFromMidnight(signOffActual);

  return isInRange(signOnMinutes, start, end) || isInRange(signOffMinutes, start, end) ? 1 : 0;
});

          const totalAmount = allowances.reduce(
            (sum, val, idx) => sum + val * NIGHT_ALLOWANCES[idx].rate,
            0
          );

          return {
            id: rosterDate,
            date: rosterDate,
            duty_no: roster.duty_no || '',
            sign_on_time: roster.sign_on_time || '',
            sign_on_location: roster.sign_on_location || '',
            sign_off_time: roster.sign_off_time || '',
            sign_off_location: roster.sign_off_location || '',
          sign_on_actual_time: signOnActual ? signOnActual.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata', // Optional: shows IST instead of UTC
  })
 : '',
            sign_on_actual_location: matchingRecord?.sign_on_actual_location || '',
            sign_off_actual_time: signOffActual ? signOffActual.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Kolkata', // Optional: shows IST instead of UTC
  }) : '',
            sign_off_actual_location: matchingRecord?.sign_off_actual_location || '',
            allowance_1: allowances[0],
            allowance_2: allowances[1],
            allowance_3: allowances[2],
            allowance_4: allowances[3],
            total_amount: totalAmount,
          };
        });

        setRows(mergedData);
      } catch (err) {
        console.error(err);
        setError('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [employeeId]);

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Container maxWidth="xl">
      <Box mt={5} mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Night Data of {employeeName}
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" mt={1}>
          Employee ID: {cleanId}
        </Typography>

 <div style={{ position: 'absolute', top: 100, right: 100, zIndex: 999 }}><Button variant="contained" color="secondary" onClick={() => setOpen(true)} sx={{ mb: 2 }}>
  Download
</Button>
</div>

<Dialog open={open} onClose={() => setOpen(false)}>
  <DialogTitle>Select Date to Download</DialogTitle>
  <DialogContent>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
  <Box display="flex" flexDirection="column" gap={2}>
    <DatePicker
      label="Start Date"
      value={startDate}
      onChange={(newValue) => setStartDate(newValue)}
      slotProps={{ textField: { fullWidth: true } }}
    />
    <DatePicker
      label="End Date"
      value={endDate}
      onChange={(newValue) => setEndDate(newValue)}
      slotProps={{ textField: { fullWidth: true } }}
    />
  </Box>
</LocalizationProvider>

    <Button
      variant="contained"
      color="success"
      sx={{ mt: 2 }}
      disabled={!startDate || !endDate}
      onClick={() => {
        setOpen(false);
        setTimeout(() => handleDownload(), 500); // delay to allow dialog to close
      }}
    >
      Download PDF
    </Button>
  </DialogContent>
</Dialog>


        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell rowSpan={2} sx={{
    fontWeight: 'bold',
    backgroundColor: '#f0f4ff', // light blue or any other color
    color: '#1a237e' // dark blue text for contrast
  }}>Date</TableCell>
                <TableCell rowSpan={2} sx={{
    fontWeight: 'bold',
    backgroundColor: '#f0f4ff', // light blue or any other color
    color: '#1a237e' // dark blue text for contrast
  }}>Duty No.</TableCell>
                <TableCell align="center" colSpan={4} sx={{
    fontWeight: 'bold',
    backgroundColor: '#f0f4ff', // light blue or any other color
    color: 'BLACK' // dark blue text for contrast
  }}>Schedule</TableCell>
                <TableCell align="center" colSpan={4} sx={{
    fontWeight: 'bold',
    backgroundColor: '#f0f4ff', // light blue or any other color
    color: 'BLACK' // dark blue text for contrast
  }}>Actual</TableCell>
                <TableCell align="center" rowSpan={2} sx={{
    fontWeight: 'bold',
    backgroundColor: '#f0f4ff', // light blue or any other color
    color: '#1a237e' // dark blue text for contrast
  }}>SignOn before 02:00 / SignOff after 01:00</TableCell>
                <TableCell align="center" rowSpan={2} sx={{
    fontWeight: 'bold',
    backgroundColor: '#f0f4ff', // light blue or any other color
    color: '#1a237e' // dark blue text for contrast
  }}>SignOn before 03:00 / SignOff after 00:00</TableCell>
                <TableCell align="center" rowSpan={2} sx={{
    fontWeight: 'bold',
    backgroundColor: '#f0f4ff', // light blue or any other color
    color: '#1a237e' // dark blue text for contrast
  }}>SignOn before 04:00 / SignOff after 23:00</TableCell>
                <TableCell align="center" rowSpan={2} sx={{
    fontWeight: 'bold',
    backgroundColor: '#f0f4ff', // light blue or any other color
    color: '#1a237e' // dark blue text for contrast
  }}>SignOn before 05:00 / SignOff after 23:00</TableCell>
                <TableCell align="center" rowSpan={2} sx={{
    fontWeight: 'bold',
    backgroundColor: '#f0f4ff', // light blue or any other color
    color: '#1a237e' // dark blue text for contrast
  }}>Total (₹)</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{
    fontWeight: 'bold',
    backgroundColor: '#f0f4ff', // light blue or any other color
    color: '#1a237e' // dark blue text for contrast
  }}>Sign-On Time</TableCell>
                <TableCell sx={{
    fontWeight: 'bold',
    backgroundColor: '#f0f4ff', // light blue or any other color
    color: '#1a237e' // dark blue text for contrast
  }}>Sign-On Location</TableCell>
                <TableCell sx={{
    fontWeight: 'bold',
    backgroundColor: '#f0f4ff', // light blue or any other color
    color: '#1a237e' // dark blue text for contrast
  }}>Sign-Off Time</TableCell>
                <TableCell sx={{
    fontWeight: 'bold',
    backgroundColor: '#f0f4ff', // light blue or any other color
    color: '#1a237e' // dark blue text for contrast
  }}>Sign-Off Location</TableCell>
                <TableCell sx={{
    fontWeight: 'bold',
    backgroundColor: '#f0f4ff', // light blue or any other color
    color: '#1a237e' // dark blue text for contrast
  }}>Sign-On Time</TableCell>
                <TableCell sx={{
    fontWeight: 'bold',
    backgroundColor: '#f0f4ff', // light blue or any other color
    color: '#1a237e' // dark blue text for contrast
  }}>Sign-On Location</TableCell>
                <TableCell sx={{
    fontWeight: 'bold',
    backgroundColor: '#f0f4ff', // light blue or any other color
    color: '#1a237e' // dark blue text for contrast
  }}>Sign-Off Time</TableCell>
                <TableCell sx={{
    fontWeight: 'bold',
    backgroundColor: '#f0f4ff', // light blue or any other color
    color: '#1a237e' // dark blue text for contrast
  }}>Sign-Off Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '14px', textAlign: 'center' }}>{row.date}</TableCell>

                  <TableCell>{row.duty_no}</TableCell>
                  <TableCell sx={{ color: 'blue' }}>{row.sign_on_time}</TableCell>
                  <TableCell sx={{ color: 'blue' }}>{row.sign_on_location}</TableCell>
                  <TableCell sx={{ color: 'blue' }}>{row.sign_off_time}</TableCell>
                  <TableCell sx={{ color: 'blue' }}>{row.sign_off_location}</TableCell>
                  <TableCell sx={{ color: 'green' }}>{row.sign_on_actual_time}</TableCell>
                  <TableCell sx={{ color: 'green' }}>{row.sign_on_actual_location}</TableCell>
                  <TableCell sx={{ color: 'green' }}>{row.sign_off_actual_time}</TableCell>
                  <TableCell sx={{ color: 'green' }}>{row.sign_off_actual_location}</TableCell>
                  <TableCell align="center">{row.allowance_1}</TableCell>
                  <TableCell align="center">{row.allowance_2}</TableCell>
                  <TableCell align="center">{row.allowance_3}</TableCell>
                  <TableCell align="center">{row.allowance_4}</TableCell>
                  <TableCell align="center" sx={{ color: 'red' }}>{row.total_amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
}

export default NightDataPage;

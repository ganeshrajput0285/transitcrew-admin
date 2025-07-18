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

         

const matchingRecord = recordsData.find((record) => {
  if (!record.sign_on_actual_time) return false;

  const actualDate = new Date(record.sign_on_actual_time);
  const rosterDate = new Date(roster.saved_date);

  return (
    actualDate.getDate() === rosterDate.getDate() &&
    actualDate.getMonth() === rosterDate.getMonth() &&
    actualDate.getFullYear() === rosterDate.getFullYear()
  );
});


          const signOnActual = matchingRecord?.sign_on_actual_time
            ? new Date(matchingRecord.sign_on_actual_time)
            : null;
          const signOffActual = matchingRecord?.sign_off_actual_time
            ? new Date(matchingRecord.sign_off_actual_time)
            : null;

         // Utility to convert time to minutes since midnight
const getMinutesFromMidnight = (date) =>
  date.getHours() * 60 + date.getMinutes();

// Allowance calculations with updated rules
const calculateAllowances = (signOnActual, signOffActual) => {
  let allowance_1 = 0, allowance_2 = 0, allowance_3 = 0, allowance_4 = 0;

  if (signOnActual && signOffActual) {
    const onMins = getMinutesFromMidnight(signOnActual);
    const offMins = getMinutesFromMidnight(signOffActual);

    // ₹175 allowance
    const is175SignOn = (onMins >= 1140 || onMins <= 120); // 19:00–02:00
    const is175SignOff = (offMins >= 60 && offMins <= 420); // 01:00–07:00
    if (is175SignOn && !is175SignOff) allowance_1 = 1;
    else if (!is175SignOn && is175SignOff) allowance_1 = 1;
    else if (is175SignOn && is175SignOff) {
      const onDist = Math.min(Math.abs(onMins - 1140), Math.abs((onMins > 720 ? onMins : onMins + 1440) - 1140));
      const offDist = Math.min(Math.abs(offMins - 60), Math.abs(offMins - 420));
      allowance_1 = onDist <= offDist ? 1 : 1;
    }

    // ₹140 allowance
    const is140SignOn = (onMins >= 121 && onMins <= 180); // 02:01–03:00
    const is140SignOff = (offMins >= 0 && offMins <= 59); // 00:00–00:59
    if (is140SignOn && !is140SignOff) allowance_2 = 1;
    else if (!is140SignOn && is140SignOff) allowance_2 = 1;
    else if (is140SignOn && is140SignOff) {
      const onDist = Math.abs(onMins - 150);
      const offDist = Math.abs(offMins - 30);
      allowance_2 = onDist <= offDist ? 1 : 1;
    }

    // ₹120 allowance
    const is120SignOn = (onMins >= 181 && onMins <= 240); // 03:01–04:00
    const is120SignOff = (offMins >= 1380 && offMins <= 1439); // 23:00–23:59
    if (is120SignOn && !is120SignOff) allowance_3 = 1;
    else if (!is120SignOn && is120SignOff) allowance_3 = 1;
    else if (is120SignOn && is120SignOff) {
      const onDist = Math.abs(onMins - 210);
      const offDist = Math.abs(offMins - 1410);
      allowance_3 = onDist <= offDist ? 1 : 1;
    }

    // ₹90 allowance
    const is90SignOn = (onMins >= 241 && onMins <= 300); // 04:01–05:00
    const is90SignOff = (offMins >= 1320 && offMins <= 1379); // 22:00–22:59
    if (is90SignOn && !is90SignOff) allowance_4 = 1;
    else if (!is90SignOn && is90SignOff) allowance_4 = 1;
    else if (is90SignOn && is90SignOff) {
      const onDist = Math.abs(onMins - 270);
      const offDist = Math.abs(offMins - 1410);
      allowance_4 = onDist <= offDist ? 1 : 1;
    }
  }

  return { allowance_1, allowance_2, allowance_3, allowance_4 };
};


         const { allowance_1, allowance_2, allowance_3, allowance_4 } = calculateAllowances(signOnActual, signOffActual);

const totalAmount = allowance_1 * 175 + allowance_2 * 140 + allowance_3 * 120 + allowance_4 * 90;

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
            allowance_1,
            allowance_2,
            allowance_3,
            allowance_4,
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
 // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }}>SignOn before 05:00 / SignOff after 22:00</TableCell>
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

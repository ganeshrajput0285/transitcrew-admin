import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  Box,
  CircularProgress,
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
Dialog,
  Paper,
  Button,
} from '@mui/material';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { DatePicker } from '@mui/x-date-pickers';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore); 

const EmployeeOvertimeDetail = () => {
  const { id } = useParams();
const [openCalendar, setOpenCalendar] = useState(false);
  const [employeeData, setEmployeeData] = useState(null);
const [dateRange, setDateRange] = useState([null, null]);



const fetchOvertimeDetails = useCallback(async () => {
  const { data: empData } = await supabase
    .from('employees')
    .select('*')
    .eq('employee_id', id)
    .single();
  console.log('Employee:', empData);

  const { data: rosterData } = await supabase
    .from('final_roster')
    .select('*')
    .eq('employee_id', id);
  console.log('Roster:', rosterData);

  const { data: signData } = await supabase
    .from('sign_on_off_records')
    .select('*')
    .eq('employee_id', id);
  console.log('Sign Records:', signData);

  let totalOvertimeMinutes = 0;

  const formatMinutesToHHMMSS = (mins) => {
    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);
    const s = 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  function padTime(t) {
    const [h, m, s] = t.split(':');
    return [
      h.padStart(2, '0'),
      m.padStart(2, '0'),
      s ? s.padStart(2, '0') : '00',
    ].join(':');
  }

  const days = rosterData.map((r) => {
    const rosterDate = dayjs(r.saved_date).format('YYYY-MM-DD');

    const sign = signData.find((s) =>
      dayjs(s.sign_off_actual_time).format('YYYY-MM-DD') === rosterDate
    );

    if (!sign || !sign.sign_off_actual_time) return null;

    const paddedTime = padTime(r.sign_on_time);
    const signOn = dayjs(`${rosterDate}T${paddedTime}`);
    const signOff = dayjs(sign.sign_off_actual_time);

    if (!signOn.isValid() || !signOff.isValid()) {
      console.warn('Invalid date:', {
        signOn: r.sign_on_time,
        signOff: sign.sign_off_actual_time,
      });
      return null;
    }

    const diff = signOff.diff(signOn, 'minute');
    const overtime = diff > 480 ? diff - 480 : 0;
    totalOvertimeMinutes += overtime;

    return {
      date: dayjs(r.saved_date).format('DD/MM/YYYY'),
      duty: r.duty_no,
      signOn: paddedTime,
      signOff: signOff.format('HH:mm:ss'),
      overtime: formatMinutesToHHMMSS(overtime),
    };
  }).filter(Boolean);

  console.log('Parsed Days:', days);

  setEmployeeData({
    name: empData.name,
    employeeId: empData.employee_id,
    totalOvertime: formatMinutesToHHMMSS(totalOvertimeMinutes),
    days,
  });
}, [id]);


 useEffect(() => {
    fetchOvertimeDetails();
  }, [fetchOvertimeDetails]);

  const handleDownload = () => {
const [startDate, endDate] = dateRange;

  if (!startDate || !endDate) {
    alert('Please select a valid date range.');
    return;
  }

const filteredDays = employeeData.days.filter((day) => {
  // Convert DD/MM/YYYY to YYYY-MM-DD
  const [dd, mm, yyyy] = day.date.split('/');
  const dayDate = dayjs(`${yyyy}-${mm}-${dd}`);

  return (
    dayDate.isSameOrAfter(dayjs(startDate), 'day') &&
    dayDate.isSameOrBefore(dayjs(endDate), 'day')
  );
});

if (filteredDays.length === 0) {
  alert('No data found for the selected date range.');
  return;
}
   const getTotalOvertime = (days) => {
  return days.reduce((sum, d) => {
    const [hh, mm, ss] = d.overtime.split(':').map(Number);
    return sum + hh * 3600 + mm * 60 + ss;
  }, 0);
};

const formatSecondsToHM = (totalSeconds) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${h}h ${m}m`;
};

const doc = new jsPDF();
doc.text(`Overtime Report for ${employeeData.name}`, 14, 15);
doc.setFontSize(11);
doc.text(`Employee ID: ${employeeData.employeeId}`, 14, 22);
doc.text(
  `Date Range: ${dayjs(startDate).format('YYYY-MM-DD')} to ${dayjs(endDate).format('YYYY-MM-DD')}`,
  14,
  28
);

const totalSeconds = getTotalOvertime(filteredDays);
doc.text(`Total Overtime : (${formatSecondsToHM(totalSeconds)})`, 14, 34);

doc.setFontSize(72);
    doc.setTextColor(220, 220, 220);
    doc.text('TransitCrew', 35, 160, { angle: 45 });

       autoTable(doc, {
      startY: 35,
      head: [['Date', 'Duty', 'Sign-On', 'Sign-Off', 'Overtime']],
      body: employeeData.days.map(day => [
        day.date,
        day.duty,
        day.signOn,
        day.signOff,
        day.overtime,
      ]),
      styles: { halign: 'center' },
    });

    doc.save(`Overtime_${employeeData.employeeId}.pdf`);
  };

  if (!employeeData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
 <LocalizationProvider dateAdapter={AdapterDayjs}>
    <Container maxWidth="md">
      <Box mt={5} mb={3}>
        <Typography variant="h5" fontWeight="bold">
          Overtime Data of {employeeData.name}
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" mt={1}>
          Employee ID: {employeeData.employeeId}
        </Typography>
        <Typography variant="h6" mt={2} mb={2}>
          Total Overtime: {employeeData.totalOvertime}
        </Typography>
        <Button variant="contained" color="secondary" onClick={()=> setOpenCalendar(true)}
          sx={{ mb: 2 }}
        >
          Download PDF
        </Button>
      </Box>
<Dialog open={openCalendar} onClose={() => setOpenCalendar(false)}>
          <Box p={3}>
 <Typography variant="h6" gutterBottom>
      Select Date Range
    </Typography>
 
            <DatePicker
              label="Start Date"
      value={dateRange[0]}
      onChange={(newValue) => setDateRange([newValue, dateRange[1]])}
      sx={{ mr: 2 }}
    />
    <DatePicker
      label="End Date"
      value={dateRange[1]}
      onChange={(newValue) => setDateRange([dateRange[0], newValue])}
    />

            <Box mt={2} textAlign="right">
              <Button
                variant="contained"
                onClick={() => {
                  handleDownload();
                  setOpenCalendar(false);
                }}
                disabled={!dateRange[0] || !dateRange[1]}
              >
                Download PDF
              </Button>
            </Box>
          </Box>
        </Dialog>

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: 'lightblue' }}>
            <TableRow>
              <TableCell align="center"><b>Date</b></TableCell>
              <TableCell align="center"><b>Duty_No</b></TableCell>
              <TableCell align="center"><b>Sign-On Time</b></TableCell>
              <TableCell align="center"><b>Sign-Off Time</b></TableCell>
              <TableCell align="center"><b>Overtime</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employeeData.days.map((day, i) => (
              <TableRow key={i}>
                <TableCell align="center">{dayjs(day.date, 'DD/MM/YYYY').format('DD/MM/YYYY')}</TableCell>

                <TableCell align="center">{day.duty}</TableCell>
                <TableCell align="center">{day.signOn}</TableCell>
                <TableCell align="center">{day.signOff}</TableCell>
                <TableCell align="center">{day.overtime}</TableCell>
              </TableRow>
            ))}

          </TableBody>
        </Table>
      </TableContainer>
    </Container>
</LocalizationProvider>
  );
};

export default EmployeeOvertimeDetail;

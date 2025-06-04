import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link } from 'react-router-dom';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { generateOvertimePDF } from '../panels/generateOvertimePDF';
import {
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TableHead,
  TableRow,
  Paper,
  Typography
} from '@mui/material';
import dayjs from 'dayjs'; 


const OvertimeTracking = () => {
const [monthPickerOpen, setMonthPickerOpen] = useState(false);
const [selectedMonth, setSelectedMonth] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [ setSelectedEmployee] = useState(null);

function formatMinutesToHMS(minutes) {
  const hrs = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  const secs = Math.round((minutes * 60) % 60);
  return `${hrs}h ${mins}m ${secs}s`;
}


  useEffect(() => {
    fetchOvertimeData();
  }, []);

  const fetchOvertimeData = async () => {
    try {
      // Fetch employees
      const { data: employeeList } = await supabase.from('employees').select('*');
     console.log('Employees:', employeeList);

      // Fetch roster (scheduled sign-on_times)
      const { data: rosterList } = await supabase.from('final_roster').select('*');
      console.log('Roster:', rosterList);

      // Fetch actual sign-on/off data
      const { data: records } = await supabase.from('sign_on_off_records').select('*');
      console.log('Sign On/Off Records:', records);

      // Calculate overtime
      const overtimeData = employeeList.map(emp => {
        const userRoster = rosterList.filter(r => r.employee_id === emp.employee_id);
        

        let totalMinutes = 0;

function padTime(t) {
  const [h, m, s] = t.split(':');
  return [
    h.padStart(2, '0'),
    m.padStart(2, '0'),
    s ? s.padStart(2, '0') : '00',
  ].join(':');
}



       
const dailyRecords = userRoster.map(r => {
  const rosterDate = dayjs(r.saved_date).format('YYYY-MM-DD');

  const sign = records.find(s =>
    s.employee_id === r.employee_id &&
    dayjs(s.sign_on_actual_time).format('YYYY-MM-DD') === rosterDate
  );

  if (!sign || !sign.sign_off_actual_time) return null;

  const paddedTime = padTime(r.sign_on_time);
  const signOn = dayjs(`${rosterDate}T${paddedTime}`);
  const signOff = dayjs(sign.sign_off_actual_time);

  if (!signOn.isValid() || !signOff.isValid()) {
    console.warn('Invalid date:', { signOn, signOff });
    return null;
  }

  const workedMinutes = signOff.diff(signOn, 'minute');
  const overtime = workedMinutes > 480 ? workedMinutes - 480 : 0;

  totalMinutes += overtime;

  return {
    date: rosterDate,
    dutyNo: r.duty_no,
    signOnTime: r.sign_on_time,
    signOffTime: sign.sign_off_actual_time,
    overtimeMinutes: Math.round(overtime)
  };
}).filter(Boolean);


        return {
          employeeId: emp.employee_id,
          name: emp.name,
          totalOvertime: Math.round(totalMinutes),
          days: dailyRecords
        };
      });

      setEmployees(overtimeData);
    } catch (err) {
      console.error('Error fetching overtime data:', err.message);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(search.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(search.toLowerCase())
  );

 const handleDownloadMonthlyPDF = (monthDate) => {
  if (!monthDate) return;

  const selectedMonthStr = dayjs(monthDate).format('YYYY-MM');
  
  const monthlyData = employees.map(emp => {
    const monthlyDays = emp.days.filter(day => 
      dayjs(day.date).format('YYYY-MM') === selectedMonthStr
    );
    
    const monthlyOvertime = monthlyDays.reduce((sum, d) => sum + d.overtimeMinutes, 0);
    
    return {
      employeeId: emp.employeeId,
      name: emp.name,
      totalOvertime: monthlyOvertime
    };
  }).filter(emp => emp.totalOvertime > 0); // only include if overtime exists

  if (monthlyData.length === 0) {
    alert("No overtime data found for the selected month.");
    return;
  }

  const headers = ['Employee ID', 'Name', 'Total Overtime (min)'];
  const rows = monthlyData.map(emp => [emp.employeeId, emp.name, formatMinutesToHMS(emp.totalOvertime)]);

  generateOvertimePDF({
    title: `Overtime Summary - ${selectedMonthStr}`,
    headers,
    rows,
    filename: `Overtime_Summary_${selectedMonthStr}.pdf`
  });
};


   return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h5" gutterBottom>
        Overtime Tracking
      </Typography>

      <TextField
        label="Search by Name or ID"
        variant="outlined"
        fullWidth
        sx={{ mb: 3 }}
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <Button
        variant="contained"
        onClick={() => setMonthPickerOpen(true)} sx={{ mb: 4 }}>
  Download Monthly Overtime PDF
      </Button>
<Dialog open={monthPickerOpen} onClose={() => setMonthPickerOpen(false)}>
  <DialogTitle>Select Month to Download</DialogTitle>
  <DialogContent>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        views={['year', 'month']}
        label="Select Month"
        value={selectedMonth}
        onChange={(newValue) => setSelectedMonth(newValue)}
        renderInput={(params) => <TextField fullWidth sx={{ mt: 2 }} {...params} />}
      />
    </LocalizationProvider>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setMonthPickerOpen(false)}>Cancel</Button>
    <Button
      variant="contained"
      onClick={() => {
        if (selectedMonth) {
          handleDownloadMonthlyPDF(selectedMonth);
          setMonthPickerOpen(false);
        }
      }}
    >
      Download
    </Button>
  </DialogActions>
</Dialog>


      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><b>Employee ID</b></TableCell>
              <TableCell><b>Name</b></TableCell>
              <TableCell><b>Total Overtime (min)</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmployees.map(emp => (
              <TableRow
                key={emp.employeeId}
                hover
                onClick={() => setSelectedEmployee(emp)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell>
 <Link to={`/employee/${emp.employeeId}/overtime`} style={{ color: '#1D4ED8', textDecoration: 'underline' }}>{emp.employeeId}
</Link></TableCell>
                <TableCell>
  <Link to={`/employee/${emp.employeeId}/overtime`} style={{ color: '#1D4ED8', textDecoration: 'underline' }}>
    {emp.name}
  </Link>
</TableCell>
                <TableCell>{formatMinutesToHMS(emp.totalOvertime)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

    </Box>
  );
};

export default OvertimeTracking;

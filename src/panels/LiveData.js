import React, { useEffect, useState } from 'react';
import { keyframes } from '@emotion/react';
import useSound from 'use-sound';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import autoTable from "jspdf-autotable";
import { jsPDF } from "jspdf";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Avatar,
 MenuItem,
  Stack,
  Chip, TableCell, TableContainer,
  TableHead, TableRow,
Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';


import { supabase } from '../supabaseClient';


const blinkRed = keyframes`
  0% { background-color: #ef9a9a; }
  50% { background-color: #ffcdd2; }
  100% { background-color: #ef9a9a; }
`;



const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  return new Date(timeStr).toLocaleTimeString('en-GB', { hour12: false });
};


const LiveSignOnDashboard = () => {
  const [roster, setRoster] = useState([]);
 const [schedule, setSchedule] = useState([]);
  const [records, setRecords] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
const [mutedIds, setMutedIds] = useState({});
const [actionDialogOpen, setActionDialogOpen] = useState(false);
const [selectedRow, setSelectedRow] = useState(null);
const [playAlarm, { stop, pause }] = useSound('/alarm.mp3', { loop: true });
const [alarmPlaying, setAlarmPlaying] = useState(false);
const [selectedDate, setSelectedDate] = useState(null);
 const [dialogOpen, setDialogOpen] = useState(false);

const isLate = (row) => {
  if (!row || !row.sign_on_time) return false;

  const now = dayjs(); // Current date and time
  const [hour, minute] = row.sign_on_time.split(':').map(Number);
  const scheduledSignOn = dayjs().hour(hour).minute(minute).second(0);

  // If sign_on_actual_time is not present or not today, assume not signed on
  if (!row.sign_on_actual_time || !dayjs(row.sign_on_actual_time).isSame(dayjs(), 'day')) {
    return now.isAfter(scheduledSignOn);
  }

  const actualSignOn = dayjs(row.sign_on_actual_time);

  return actualSignOn.isAfter(scheduledSignOn); // Late if actual > scheduled
};


const [manualSignOffDialogOpen, setManualSignOffDialogOpen] = useState(false);
  const [signOffFormData, setSignOffFormData] = useState({
    ba_result: '',
    ba_number: '',
    sign_off_time: dayjs(),
    sign_off_location: ''
  });
const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

 const handleFormChange = (field, value) => {
    setSignOffFormData((prev) => ({ ...prev, [field]: value }));
  };


const isSignOffDue = (employee_id) => {
  const duty = roster.find(r => r.employee_id === employee_id);
  if (!duty || !duty.sign_off_time) return false;
  const [hour, minute] = duty.sign_off_time.split(':');
  const today = dayjs();
  const dueTime = today.hour(Number(hour)).minute(Number(minute));
  return dayjs().isAfter(dueTime);
}; 

const handleManualSignOffChange = (e) => {
  setSignOffFormData(prev => ({
    ...prev,
    [e.target.name]: e.target.value,
  }));
};




 useEffect(() => {
  const fetchData = async () => {
    const { data: upcoming } = await supabase.from('roster_schedule').select('*');
   
    const { data: signOns } = await supabase.from('sign_on_off_records').select('*');
    setSchedule(upcoming || []);
     setRoster(upcoming || []);
    setRecords(signOns || []);
    
  };

  fetchData();
  const interval = setInterval(fetchData, 1000);
  return () => 
    clearInterval(interval);
}, []);

 const handleDownload = () => {
    setDialogOpen(true); // open the calendar popup
  };

const handleDateChange = async () => {
 setDialogOpen(false);
    if (selectedDate) {
  const formattedDate = dayjs(selectedDate).format("YYYY-MM-DD");
  

  // Step 1: Fetch roster for selected date
  const { data: rosterData, error: rosterError } = await supabase
    .from("final_roster")
    .select("*");

  if (rosterError) {
    console.error("Roster fetch error:", rosterError);
    alert("Error fetching roster.");
    return;
  }

  const filteredRoster = rosterData.filter(
    (entry) => dayjs(entry.saved_date).format("YYYY-MM-DD") === formattedDate
  );

  if (filteredRoster.length === 0) {
    alert("No roster found for this date.");
    return;
  }

  // Step 2: Fetch all sign_on_off_records for selected date
  const { data: signData, error: signError } = await supabase
    .from("sign_on_off_records")
    .select("*");

  if (signError) {
    console.error("Sign records fetch error:", signError);
    alert("Error fetching sign-on/off records.");
    return;
  }

  const filteredSignData = signData.filter(
    (record) =>
      dayjs(record.sign_on_actual_time).format("YYYY-MM-DD") === formattedDate
  );

  // Step 3: Match based on employee_id
  const matchedData = filteredRoster.map((rosterEntry) => {
    const signEntry = filteredSignData.find(
      (sign) => sign.employee_id === rosterEntry.employee_id
    );

    return {
      name: rosterEntry.employee_name,
      employee_id: rosterEntry.employee_id,
      duty_number: rosterEntry.duty_no,
      sign_on_time: signEntry?.sign_on_actual_time
        ? dayjs(signEntry.sign_on_actual_time).format("HH:mm:ss")
        : "Not Signed On",
      sign_on_location: signEntry?.sign_on_actual_location || "-",
      sign_off_time: signEntry?.sign_off_actual_time
        ? dayjs(signEntry.sign_off_actual_time).format("HH:mm:ss")
        : "Not Signed Off",
      sign_off_location: signEntry?.sign_off_actual_location || "-",
    };
  });

  const hasAnySignData = matchedData.some(
    (entry) => entry.sign_on_time !== "Not Signed On"
  );

  if (!hasAnySignData) {
    alert("No sign-on/off records found for employees on this date.");
    return;
  }

  // Step 4: Create PDF with watermark
  const doc = new jsPDF();

  // Watermark
  doc.setFontSize(40);
  doc.setTextColor(200);
  doc.text("TransitCrew", 35, 150, { angle: 45 });

  // Title
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text(`Sign-On/Off Report - ${formattedDate}`, 14, 20);

  // Table
  autoTable(doc, {
    startY: 30,
    head: [
      [
        "Name",
        "Employee ID",
        "Duty Number",
        "Sign-On Time",
        "Sign-On Location",
        "Sign-Off Time",
        "Sign-Off Location",
      ],
    ],
    body: matchedData.map((d) => [
      d.name,
      d.employee_id,
      d.duty_number,
      d.sign_on_time,
      d.sign_on_location,
      d.sign_off_time,
      d.sign_off_location,
    ]),
    styles: { fontSize: 10 },
    headStyles: {
      fillColor: [22, 160, 133],
      textColor: [255, 255, 255],
    },
  });

  doc.save(`TransitCrew_SignOnReport_${formattedDate}.pdf`);
}};
const getStatus = (emp, scheduledTime) => {
  const actual = records.find((r) => r.employee_id === emp);

  if (!actual || !actual.sign_on_actual_time) {
    // If no actual sign-on, check if current time has passed scheduled time
    const now = new Date();
    const [h, m, s] = scheduledTime.split(':').map(Number);
    const scheduledDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, s || 0);
    return now > scheduledDate ? 'late' : 'upcoming';
  }

  // If actual sign-on exists, compare with scheduled
  const actualDate = new Date(actual.sign_on_actual_time);
  const localActual = new Date(actualDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));

  const [h, m, s] = scheduledTime.split(':').map(Number);
  const scheduledDate = new Date(localActual.getFullYear(), localActual.getMonth(), localActual.getDate(), h, m, s || 0);

  console.log('Scheduled:', scheduledDate.toLocaleTimeString());
  console.log('Actual (converted):', localActual.toLocaleTimeString());

  return localActual > scheduledDate ? 'late' : 'on_time';
};


 useEffect(() => {
  const anyLate = schedule.some(
    (item) => getStatus(item.employee_id, item.sign_on_time) === 'late' && !mutedIds[item.employee_id]
  );

console.log("Any Late Detected:", anyLate);

  if (anyLate && !alarmPlaying) {
 console.log("Playing alarm...");
    playAlarm();
    setAlarmPlaying(true);
  } else if (!anyLate && alarmPlaying) {
    stop();
    setAlarmPlaying(false);
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [schedule, records, mutedIds, currentTime]);


 useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // update every 1 second

    return () => clearInterval(timer); // cleanup on unmount
  }, []);
  // Filter data as before but we'll render as cards/grids
 const upcomingDuties = schedule.filter(row =>
  !records.some(record =>
    record.employee_id === row.employee_id &&
    dayjs(record.sign_on_actual_time).isSame(dayjs(row.duty_date), 'day')
  )

);

const signOnTime = '2025-05-20T08:30:00Z'; // example sign-on actual time from your data

if (isSignOnForToday(signOnTime)) {
  console.log('Sign-on is valid for today');
} else {
  console.log('Sign-on is NOT for today');
}

function isSignOnForToday(signOnActualTime) {
  const signOnDate = new Date(signOnActualTime).toISOString().split('T')[0];
  const todayDate = new Date().toISOString().split('T')[0];
  return signOnDate === todayDate;
}



  const signOns = records.filter(rec => {
    return rec.sign_on_actual_time && !rec.sign_off_time &&
      new Date(rec.sign_on_actual_time).toDateString() === new Date().toDateString();
  }).map(rec => {
    const duty = roster.find(r => r.employee_id === rec.employee_id);
    return {
      ...rec,
      duty_no: duty?.duty_no || '',
      employee_name: duty?.employee_name || '',
sign_on_location: rec.sign_on_location || duty?.sign_on_actual_location || '',
    };
  });







const today = dayjs().format('YYYY-MM-DD');

const signOffs = records
  .filter((rec) => {
    if (!rec.sign_on_actual_time || !rec.sign_off_actual_time) return false;

    const signOffDate = dayjs(rec.sign_off_actual_time).format('YYYY-MM-DD');
    return signOffDate === today;
  })
  .map((rec) => {
    const duty = roster.find(
      (r) => String(r.employee_id) === String(rec.employee_id)
    );
const formatTime = (input) => {
  if (!input) return '—';
  const date = new Date(input);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('en-GB', { hour12: false });
};


    return {
      ...rec,
      duty_no: duty?.duty_no || '',
      employee_name: duty?.employee_name || '',
      sign_on_actual_location: rec.sign_on_actual_location || '-',
      sign_off_actual_location: rec.sign_off_actual_location || '-',
      sign_on_ba_number: rec.sign_on_ba_number || '-',
      sign_off_ba_number: rec.sign_off_ba_number || '-',
      sign_on_actual_time: formatTime(rec.sign_on_actual_time),
      sign_off_actual_time: formatTime(rec.sign_off_actual_time),
      sign_on_photo: rec.sign_on_photo || '',
      sign_off_photo: rec.sign_off_photo || '',
    };
  });


const sortedUpcomingDuties = [...upcomingDuties].sort(
  (a, b) => new Date(a.sign_on_time) - new Date(b.sign_on_time)
);







  return (
    <Box sx={{ p: 4, bgcolor: '#f7f9fc', minHeight: '100vh' }}>
      <Typography variant="h3" fontWeight="bold" mb={3} color="black">
        Live Dashboard
      </Typography>

      <Typography variant="subtitle1" fontWeight="bold" color="text.secondary" mb={4}>
        Current Time: {currentTime.toLocaleString('en-IN', { hour12: false })}
      </Typography>


<LocalizationProvider dateAdapter={AdapterDayjs}>
     <div style={{ position: 'absolute', top: 100, right: 100, zIndex: 999 }}>
      <Button variant="contained" onClick={handleDownload}>
        Download 
      </Button>
      </div>
     <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>Select Date for Roster Download</DialogTitle>
        <DialogContent>
          <DatePicker
            label="Select Date"
            value={selectedDate}
            onChange={(newDate) => setSelectedDate(newDate)}
            renderInput={(params) => <TextField fullWidth margin="normal" {...params} />}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDateChange}
            variant="contained"
            disabled={!selectedDate}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>


      {/* Upcoming Duties */}
      <Paper elevation={4} sx={{ p: 3, mb: 5, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="600" mb={3} color="#1565c0">
          Upcoming Duties
        </Typography>

        {upcomingDuties.length === 0 ? (
          <Typography align="center" color="text.secondary" py={4}>
            No Upcoming Duties
          </Typography>
        ) : (
        
          <Grid container spacing={3}>
      {sortedUpcomingDuties.map((row, idx) => {
        const late = isLate(row); // records should be passed in as a prop or available in context
  return (
    <Grid item xs={12} md={6} lg={4} key={row.employee_id}>
      <Paper
        elevation={2}
        sx={{
          p: 2,
          borderRadius: 2,
          backgroundColor: late ? '#ffebee' : '#e3f2fd', // fallback red
          animation: late ? `${blinkRed} 1.5s infinite` : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          minHeight: 140,
        }}
      >
        <Typography variant="subtitle2" color="primary" fontWeight="bold">
          Duty No: {row.duty_no}
        </Typography>
        <Typography variant="body1" fontWeight="600">
          {row.employee_name} ({row.employee_id})
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sign-On Time: {row.sign_on_time || '-'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Sign-On Location: {row.sign_on_location || '-'}
        </Typography>

        {late && (
          <>
          <Typography variant="caption" color="error">
            ⚠️ Late Sign-On Detected
          </Typography>
        

        <Stack direction="row" spacing={1} mt={1}>
          <Chip
            label="Action"
            color="warning"
            clickable
            onClick={() => {
              setSelectedRow(row);
              setActionDialogOpen(true);
            }}
          />
        </Stack>
        </>
            )}
      </Paper>
    </Grid>
  );
})}


          </Grid>
        )}
      </Paper>
    

<Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)}>
  <DialogTitle>Actions for {selectedRow?.employee_name}</DialogTitle>
  <DialogContent>
    <Typography variant="body2">Choose an action:</Typography>
  </DialogContent>
  <DialogActions>
    <Button
      onClick={() => {
        setMutedIds(prev => ({
          ...prev,
          [selectedRow.employee_id]: true,
        }));
        pause();

        setTimeout(() => {
          setMutedIds(prev => {
            const updated = { ...prev };
            delete updated[selectedRow.employee_id];
            return updated;
          });
        }, 5 * 60 * 1000); // 5 minutes

        setActionDialogOpen(false);
      }}
      color="secondary"
      variant="contained"
    >
      Mute Alarm (5 min)
    </Button>

    <Button
      onClick={async () => {
        // simulate dummy sign-on
        const { error } = await supabase.from('sign_on_off_records').insert([{
          employee_id: selectedRow.employee_id,
          sign_on_actual_time: new Date().toISOString(),
          sign_on_location: 'Unknown',
          sign_on_ba_number: 'DUMMY123',
        }]);

        if (!error) {
          setSchedule(prev => prev.filter(r => r.employee_id !== selectedRow.employee_id));
        }

        setActionDialogOpen(false);
      }}
      color="primary"
      variant="contained"
    >
      Sign-On Complete
    </Button>
  </DialogActions>
</Dialog>


      {/* Sign-Ons */}
      <Paper elevation={4} sx={{ p: 3, mb: 5, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="600" mb={3} color="#2e7d32">
          Sign-Ons
        </Typography>

        {signOns.length === 0 ? (
          <Typography align="center" color="text.secondary" py={4}>
            No Sign-Ons Today
          </Typography>
        ) : (
          <Grid container spacing={3}>
           {signOns
  .filter((rec) => !rec.sign_off_actual_time)
  .map((rec, idx) => {
    const showManualButton = isSignOffDue(rec.employee_id);
    return (
              <Grid item xs={12} md={6} lg={4} key={rec.employee_id + idx}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: '#e8f5e9',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 2,
                    minHeight: 120,
                  }}
                >
                  <Avatar
                    src={rec.sign_on_time_photo}
                    alt={rec.employee_name}
                    sx={{ width: 64, height: 64, borderRadius: 2 }}
                  />
                  <Box>
                    <Typography variant="subtitle1" fontWeight="700">
                      {rec.employee_name}  {rec.employee_id}

                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Duty No: {rec.duty_no || '-'}
                    </Typography>
<Typography variant="body2" fontWeight="600" color="#2e7d32">
                      BA No: {rec.sign_on_ba_number || '-'}
                    </Typography>
                    <Typography variant="body2" fontWeight="600" color="#2e7d32">
                      Signed On At: {formatTime(rec.sign_on_actual_time)}
                    </Typography>
<Typography variant="body2" color="text.secondary">
  Sign-On Location: {rec.sign_on_actual_location || '-'}
</Typography>
 {showManualButton && (
            <Box mt={2}>
              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  setSelectedRow(rec);
                  setManualSignOffDialogOpen(true);
                }}
              >
                Manual Sign-Off
              </Button>
                   </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      );
    })}
          </Grid>
        )}
      </Paper>


<Dialog open={manualSignOffDialogOpen} onClose={() => setManualSignOffDialogOpen(false)}>
  <DialogTitle>Manual Sign-Off for {selectedRow?.employee_name}</DialogTitle>
  <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <TextField
       select
  fullWidth
  label="BA Result"
  name="ba_result"
  value={signOffFormData.ba_result}
  onChange={handleManualSignOffChange}
  sx={{ mb: 2 }}
>
  <MenuItem value="Positive">Positive</MenuItem>
  <MenuItem value="Negative">Negative</MenuItem>
</TextField>
    <TextField
      label="Sign-Off BA Number"
      value={signOffFormData.ba_number}
          onChange={(e) => handleFormChange('ba_number', e.target.value)}
        
      fullWidth
    />
    <TextField
      label="Sign-Off Location"
      value={signOffFormData.sign_off_location}
          onChange={(e) => handleFormChange('sign_off_location', e.target.value)}
        
      fullWidth
    />
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateTimePicker
        label="Sign-Off Time"
        value={signOffFormData.sign_off_time}
         onChange={(newValue) => setSignOffFormData(prev => ({
    ...prev,
    sign_off_time: newValue
  }))}
  renderInput={(params) => <TextField {...params} fullWidth sx={{ mt: 2 }} />}
/>
      
    </LocalizationProvider>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setManualSignOffDialogOpen(false)}>Cancel</Button>
    <Button onClick={() => {
      setManualSignOffDialogOpen(false);
      setConfirmDialogOpen(true);
    }} variant="contained">
      OK
    </Button>
  </DialogActions>
</Dialog>


<Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
  <DialogTitle>Confirm Manual Sign-Off</DialogTitle>
  <DialogContent>
    Are you sure you want to save this manual sign-off?
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
    <Button
      onClick={async () => {
        const { error } = await supabase
          .from('sign_on_off_records')
          .update({
  sign_off_ba_result: signOffFormData.ba_result,
  sign_off_ba_number: signOffFormData.ba_number,
  sign_off_actual_time:signOffFormData.sign_off_time?.toISOString(),
  sign_off_actual_location: signOffFormData.sign_off_location
})

          .eq('employee_id', selectedRow.employee_id)
          .eq('sign_on_actual_time', selectedRow.sign_on_actual_time);

        if (error) {
          alert('Error saving sign-off');
          console.error(error);
        } else {
          alert('Sign-off saved successfully');
        }
        setConfirmDialogOpen(false);
      }}
      color="primary"
      variant="contained"
    >
      Confirm
    </Button>
  </DialogActions>
</Dialog>





      {/* Sign-Offs */}
      <Paper elevation={4} sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="600" mb={3} color="#d32f2f">
          Sign-Offs
        </Typography>

        {signOffs.length === 0 ? (
          <Typography align="center" color="text.secondary" py={4}>
            No Sign-Offs Today
          </Typography>
        ) : (
    <TableContainer component={Paper}>
  <table>
  <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
    <TableRow>
      <TableCell><strong>Employee Name</strong></TableCell>
      <TableCell><strong>Employee ID</strong></TableCell>
      <TableCell><strong>Duty No</strong></TableCell>
      <TableCell><strong>Sign-On Time</strong></TableCell>
      <TableCell><strong>Sign-Off Time</strong></TableCell>
      <TableCell><strong>Sign-On/Off BA No.</strong></TableCell>
      <TableCell><strong>Sign-On/Off Location</strong></TableCell>
      <TableCell><strong>Sign-On Photo</strong></TableCell>
      <TableCell><strong>Sign-Off Photo</strong></TableCell>
    </TableRow>
  </TableHead>



  <tbody>



{signOffs.map((rec, idx) => (
    <tr key={`${rec.employee_id}-${rec.duty_no}-${idx}`}>
      <TableCell>{rec.employee_name}</TableCell>
      <TableCell>{rec.employee_id}</TableCell>
      <TableCell>{rec.duty_no}</TableCell>
    <td className="px-4 py-2 border" style={{ color: 'green' }}>
  {rec.sign_on_actual_time}
</td>
<td className="px-4 py-2 border" style={{ color: 'red' }}>
  {rec.sign_off_actual_time}
</td>


      <TableCell>
        <div className="text-green-600"style={{ color: 'green' }}>{rec.sign_on_ba_number}</div>
        <div className="text-red-600"style={{ color: 'red' }}>{rec.sign_off_ba_number}</div>
      </TableCell>
      <TableCell>
        <div className="text-green-600"style={{ color: 'green' }}>{rec.sign_on_actual_location}</div>
        <div className="text-red-600"style={{ color: 'red' }}>{rec.sign_off_actual_location}</div>
      </TableCell>
      <TableCell>
        <a href={rec.sign_on_time_photo} target="_blank" rel="noopener noreferrer">
    
                                
                  <Avatar
                    src={rec.sign_on_time_photo}
                    alt={rec.employee_name}
                    sx={{ width: 56, height: 56, cursor: "pointer" }}
                  />
                 </a>

      </TableCell>
      <TableCell>
       <a href={rec.sign_off_time_photo} target="_blank" rel="noopener noreferrer">
    
                                
                  <Avatar
                    src={rec.sign_off_time_photo}
                    alt={rec.employee_name}
                    sx={{ width: 56, height: 56, cursor: "pointer" }}
                  />
                 </a>
      </TableCell>
    </tr>
))}

  </tbody>
</table>

</TableContainer>

      )}
            
         
        
      </Paper>
    </Box>
  );
};

export default LiveSignOnDashboard;

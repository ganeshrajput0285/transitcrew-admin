import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Avatar, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const WelcomePage = () => {
  const [name, setName] = useState('Controller');
  const [photoURL, setPhotoURL] = useState('');
  const [currentTime, setCurrentTime] = useState('');
const [designation, setDesignation] = useState('');
const [dob, setDob] = useState('');
const [doj, setDoj] = useState('');
const [permAddress, setPermAddress] = useState('');
const [resAddress, setResAddress] = useState('');
const [employeeId, setEmployeeId] = useState('');
const [userEmail, setUserEmail] = useState('');


  const navigate = useNavigate();

  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      const { data, error } = await supabase.auth.getUser();
  
if (error || !data?.user?.email) {
    console.error('User not found or error:', error?.message);
    return;
  }


 const userEmail = data.user.email;
  const employeeId = userEmail.split('@')[0];

 setEmployeeId(employeeId);       // Set employee ID separately
    setUserEmail(userEmail);  

     const { data: empData, error: empError } = await supabase
    .from('employees')
    .select('name, photo_url, designation, dob, doj, permanent_address, residential_address')
    .eq('employee_id', employeeId)
    .single();

  if (!empError && empData) {
    setName(empData.name);
    setPhotoURL(empData.photo_url);
     setDesignation(empData.designation);
  setDob(empData.dob);
  setDoj(empData.doj);
  setPermAddress(empData.permanent_address);
  setResAddress(empData.residential_address);
  
  } else {
    console.error('Employee not found or error:', empError?.message);
  }
};

    fetchEmployeeDetails();

    const interval = setInterval(() => {
      const now = new Date();
      const formatted = now.toLocaleString('en-GB', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      setCurrentTime(formatted);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        height: '100vh',
        backgroundColor: '#f0f2f5',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Paper
        elevation={10}
        sx={{
          p: 5,
          textAlign: 'center',
          borderRadius: 4,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          minWidth: 350,
        }}
      >
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Welcome Crew Controller
        </Typography>

        <Typography variant="h6" sx={{ mt: 2 }}>
          {name}
        </Typography>
<Typography variant="body2" sx={{ mb: 2 }}>
  {employeeId}
</Typography>

        <Avatar
          alt={name}
          src={photoURL}
          sx={{ width: 100, height: 100, margin: '20px auto' }}
        />

        <Typography variant="body1" sx={{ mt: 2, fontSize: '1.2rem' }}>
          {currentTime}
        </Typography>

<Box sx={{ textAlign: 'left', mt: 3 }}>
  <Typography variant="body2"><strong>Designation:</strong> {designation}</Typography>
  <Typography variant="body2"><strong>Date of Birth:</strong> {dob}</Typography>
  <Typography variant="body2"><strong>Date of Joining:</strong> {doj}</Typography>
  <Typography variant="body2"><strong>Permanent Address:</strong> {permAddress}</Typography>
  <Typography variant="body2"><strong>Residential Address:</strong> {resAddress}</Typography>
  <Typography variant="body2" sx={{ mt: 2 }}><strong>User ID:</strong> {userEmail}</Typography>
</Box>


        <Button
          variant="outlined"
          onClick={() => navigate('/admin/dashboard')}
          sx={{
            mt: 4,
            px: 4,
            py: 1.5,
            fontWeight: 600,
            textTransform: 'none',
            fontSize: '1rem',
          }}
        >
          Go to Dashboard
        </Button>
      </Paper>
    </Box>
  );
};

export default WelcomePage;

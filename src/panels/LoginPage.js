import React, { useState,  } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Alert, Link,
} from '@mui/material';
import Logo from "../assets/transitcrew-logo.svg";
import { supabase } from "../supabaseClient"; // Adjust path if needed
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: employeeId, // Assuming Employee ID is their email
      password: password,
    });

    if (error) {
      setError(error.message);
    } else {
      console.log('Logged in:', data);
      navigate('/admin/welcome'); // Change route as needed
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        backgroundImage: `url(${Logo})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: '100%',
        backgroundColor: '#f0f2f5',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Container maxWidth="sm">
       <Paper
  elevation={10}
  sx={{
    padding: 4,
    borderRadius: 4,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.25)', // Glassy background
    backdropFilter: 'blur(8px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)', // Soft shadow
    border: '1px solid rgba(255, 255, 255, 0.18)',
  }}
>


         
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Login
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" sx={{ mt: 3 }} onSubmit={handleLogin}>
            <TextField
              label="User ID"
              variant="outlined"
              fullWidth
              margin="normal"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
            />

            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

 {/* Forgot Password Link */}
            <Box sx={{ textAlign: 'right', mt: 1 }}>
             <Link
      component="button"
      onClick={() => alert('Please contact the admin to forgot password.')}
      underline="hover"
       sx={{ fontSize: '0.9rem', color: '#1976d2', cursor: 'pointer' }}
    >

                Forgot Password?
              </Link>
            </Box>

            <Button
              type="submit"
              variant="contained"
              
              fullWidth
              sx={{
                mt: 3,
                py: 1.5,
                fontWeight: 600,
                fontSize: '1rem',
                borderRadius: '8px',
                textTransform: 'none',
    backgroundColor: '#cfd2d4',          // Light gray default
    color: '#000',                       // Black text by default
    '&:hover': {
      backgroundColor: '#1976d2',        // MUI primary blue on hover
      color: '#fff', 
         },
              }}
            >
              Sign In
            </Button>

 {/* Create Account Option */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                Don’t have an account?{' '}
                <Link
      component="button"
      onClick={() => alert('Please contact the admin to create an account.')}
      underline="hover"
       sx={{ fontSize: '0.9rem', color: '#1976d2', cursor: 'pointer' }}
    >
                  Sign Up
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;

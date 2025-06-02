import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  InputAdornment,
} from '@mui/material';
import { supabase } from '../supabaseClient';

const Signup = () => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validatePassword = (pwd) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{6,}$/;
    return regex.test(pwd);
  };

  const handleSignup = async () => {
    setError('');
    setSuccess('');

    if (!employeeId || !password || !confirmPassword) {
      setError('Please fill all fields.');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password does not meet criteria.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const email = `${employeeId}`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Account created! Please check your email to verify.');
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Paper elevation={6} sx={{ p: 4, width: '100%', maxWidth: 500 }}>
        <Typography variant="h5" fontWeight={600} mb={2}>
          Sign Up
        </Typography>

        <TextField
          fullWidth
          label="User Id"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          placeholder="e.g., emp123"
          helperText="Email will be generated as employeeID@db-eco.com"
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 1 }}
        />
        <Typography variant="body2" color={validatePassword(password) ? 'green' : 'error'} sx={{ mb: 2 }}>
          Password must be at least 6 characters and include uppercase, lowercase, number, and special character.
        </Typography>

        <TextField
          fullWidth
          label="Confirm Password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          sx={{ mb: 2 }}
        />

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        {success && (
          <Typography color="green" sx={{ mb: 2 }}>
            {success}
          </Typography>
        )}

        <Button
          variant="contained"
          fullWidth
          onClick={handleSignup}
          sx={{ py: 1.5, fontWeight: 600 }}
        >
          Sign Up
        </Button>
      </Paper>
    </Box>
  );
};

export default Signup;

import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Card, CardContent, Typography, Button, Grid, Avatar, Snackbar, Alert } from '@mui/material';

const RequestSection = () => {
  const [requests, setRequests] = useState([]);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from('registration_requests')
      .select('*')
      .eq('status', 'pending');

    if (!error) {
      setRequests(data);
    } else {
      showSnackbar('Error fetching requests.', 'error');
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnack({ open: true, message, severity });
  };

  const handleApprove = async (request) => {
    const { error: insertError } = await supabase.from('employees').insert([{
      employee_id: request.employee_id,
      name: request.name,
      dob: request.dob,
      designation: request.designation,
      doj: request.doj,
      permanent_address: request.permanent_address,
      residential_address: request.residential_address,
      mobile: request.mobile,
      password: request.password,
      photo_url: request.photo_url,
      created_at: new Date().toISOString()
    }]);

    if (!insertError) {
      const { error: deleteError } = await supabase
        .from('registration_requests')
        .delete()
        .eq('id', request.id);

      if (!deleteError) {
        setRequests(prev => prev.filter(r => r.id !== request.id));
        showSnackbar(`${request.name} approved and added to employees.`);
      } else {
        showSnackbar('Failed to remove request after approval.', 'error');
      }
    } else {
      showSnackbar('Error approving employee.', 'error');
    }
  };

  const handleReject = async (id) => {
    const { error } = await supabase
      .from('registration_requests')
      .delete()
      .eq('id', id);

    if (!error) {
      setRequests(prev => prev.filter(r => r.id !== id));
      showSnackbar('Registration request rejected and deleted.');
    } else {
      showSnackbar('Error rejecting request.', 'error');
    }
  };

  return (
    <>
      <Grid container spacing={2}>
        {requests.length === 0 ? (
          <Grid item xs={12}>
            <Typography variant="h6" align="center">No pending requests.</Typography>
          </Grid>
        ) : (
          requests.map((req) => (
            <Grid item xs={12} sm={6} md={4} key={req.id}>
              <Card sx={{ p: 2 }}>
                <CardContent>
                  <Grid container spacing={1} alignItems="center">
                    <Grid item xs={4}>
                      <Avatar src={req.photo_url} alt={req.name} sx={{ width: 80, height: 80 }} />
                    </Grid>
                    <Grid item xs={8}>
                      <Typography variant="h6">{req.name}</Typography>
                      <Typography>ID: {req.employee_id}</Typography>
                      <Typography>Designation: {req.designation}</Typography>
                      <Typography>Mobile: {req.mobile}</Typography>
                    </Grid>
                  </Grid>

                  <Grid container spacing={1} mt={2}>
                    <Grid item xs={6}>
                      <Button variant="contained" color="success" fullWidth onClick={() => handleApprove(req)}>
                        Approve
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button variant="outlined" color="error" fullWidth onClick={() => handleReject(req.id)}>
                        Reject
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert onClose={() => setSnack({ ...snack, open: false })} severity={snack.severity} sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default RequestSection;

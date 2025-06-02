import React, { useEffect, useState } from "react";
import { Box, Typography, Container } from "@mui/material";

const AdminDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Format date and time
  const formattedDate = currentTime.toLocaleDateString("en-GB", {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString("en-GB", {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <Container maxWidth="md" sx={{ mt: 6 }}>
       <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        gap={1}
      >
        <Typography variant="h4" gutterBottom>
          Admin Dashboard
        </Typography>
       </Box>
        <Box textAlign="right">
<Box
        sx={{
          position: 'absolute',
          top: 100,
          right: 24,
          textAlign: 'right',
        }}
      >
          <Typography variant="subtitle1" fontWeight={500}>
            {formattedDate}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {formattedTime}
          </Typography>
        </Box>
      </Box>

      {/* You can place your actual dashboard content here */}
    </Container>
  );
};

export default AdminDashboard;

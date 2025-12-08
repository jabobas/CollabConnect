/*
Author: Aubin Mugisha
Date: December 1, 2025

Login page for user authentication. Allows users to log in with their email
and password. On successful login, stores JWT token in local storage for
authenticated requests.
*/

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, useTheme, Alert } from "@mui/material";
import axios from "axios";
import Header from "../../components/Header";
import { tokens } from "../../theme";

const Login = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/auth/login', { email, password });
      
      if (response.data.status === 'success') {
        const { user_id, person_id, access_token } = response.data.data;
        
        // Store JWT token for authentication (expires in 24 hours)
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('user_id', user_id);
        
        // Store person_id if user has claimed a profile
        if (person_id) {
          localStorage.setItem('person_id', person_id);
        }
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        
        // Notify other components about auth state change
        window.dispatchEvent(new Event('authChange'));
        
        navigate(`/user/${user_id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box m="20px">
      <Header title="Login" subtitle="Sign in to your account" />

      <Box 
        component="form" 
        onSubmit={handleLogin}
        maxWidth="500px"
        mx="auto"
        mt="40px"
      >
        <Box 
          backgroundColor={colors.primary[400]}
          borderRadius="8px"
          p="40px"
          display="flex"
          flexDirection="column"
          gap="20px"
        >
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: colors.primary[300] },
                '&:hover fieldset': { borderColor: colors.greenAccent[500] },
              },
              '& .MuiInputLabel-root': { color: colors.grey[100] },
              '& .MuiInputBase-input': { color: colors.grey[100] },
            }}
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: colors.primary[300] },
                '&:hover fieldset': { borderColor: colors.greenAccent[500] },
              },
              '& .MuiInputLabel-root': { color: colors.grey[100] },
              '& .MuiInputBase-input': { color: colors.grey[100] },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              backgroundColor: colors.greenAccent[600],
              color: colors.grey[100],
              fontSize: '16px',
              fontWeight: 'bold',
              padding: '12px',
              '&:hover': { backgroundColor: colors.greenAccent[700] },
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>

          <Box display="flex" justifyContent="space-between" mt="10px">
            <Typography 
              variant="body2" 
              sx={{ 
                color: colors.greenAccent[500], 
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' }
              }}
              onClick={() => navigate('/register')}
            >
              Don't have an account? Sign up
            </Typography>

            <Typography 
              variant="body2" 
              sx={{ 
                color: colors.greenAccent[500], 
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' }
              }}
              onClick={() => navigate('/forgot-password')}
            >
              Forgot password?
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;

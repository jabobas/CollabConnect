/*
Author: Aubin Mugisha
Date: December 1, 2025

Registration page for new users. Creates user account and stores hashed
password in database. No email verification currently implemented.
*/

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, useTheme, Alert } from "@mui/material";
import axios from "axios";
import Header from "../../components/Header";
import { tokens } from "../../theme";

const Register = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/auth/register', { email, password });
      
      if (response.data.status === 'success') {
        setSuccess('Account created successfully! Please check your email to verify your account.');
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box m="20px">
      <Header title="Register" subtitle="Create a new account" />

      <Box 
        component="form" 
        onSubmit={handleRegister}
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
          {success && <Alert severity="success">{success}</Alert>}

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
            helperText="Must be at least 8 characters"
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: colors.primary[300] },
                '&:hover fieldset': { borderColor: colors.greenAccent[500] },
              },
              '& .MuiInputLabel-root': { color: colors.grey[100] },
              '& .MuiInputBase-input': { color: colors.grey[100] },
              '& .MuiFormHelperText-root': { color: colors.grey[300] },
            }}
          />

          <TextField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Creating account...' : 'Register'}
          </Button>

          <Box display="flex" justifyContent="center" mt="10px">
            <Typography 
              variant="body2" 
              sx={{ 
                color: colors.greenAccent[500], 
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' }
              }}
              onClick={() => navigate('/login')}
            >
              Already have an account? Login
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Register;

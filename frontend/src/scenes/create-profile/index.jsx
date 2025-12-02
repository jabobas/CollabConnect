/*
Author: Aubin Mugisha
Date: December 1, 2025

Create new researcher profile form. Allows users to manually enter their
information instead of claiming existing profile. Automatically links
created profile to their user account.
*/

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, useTheme, Alert } from "@mui/material";
import axios from "axios";
import Header from "../../components/Header";
import { tokens } from "../../theme";

const CreateProfile = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    person_name: '',
    person_email: '',
    person_phone: '',
    bio: '',
    expertise_1: '',
    expertise_2: '',
    expertise_3: '',
    institution_name: '',
    department_name: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.person_name || !formData.person_email) {
      setError('Name and email are required');
      return;
    }

    setLoading(true);
    
    try {
      // First create the person profile
      const response = await axios.post('/person', formData);
      
      if (response.data.status === 'success') {
        // Then automatically link it to current user account
        const userId = localStorage.getItem('user_id');
        await axios.post(`/user/${userId}/claim-person/${response.data.data.person_id}`);
        navigate(`/user/${userId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box m="20px">
      <Header title="Create Profile" subtitle="Add your researcher information" />

      <Box 
        component="form" 
        onSubmit={handleSubmit}
        maxWidth="800px"
        mx="auto"
      >
        <Box 
          backgroundColor={colors.primary[400]}
          borderRadius="8px"
          p="40px"
          display="flex"
          flexDirection="column"
          gap="24px"
        >
          {error && <Alert severity="error">{error}</Alert>}

          <Box>
            <h3 style={{ color: colors.grey[100], marginBottom: '16px' }}>Basic Information</h3>
            <Box display="flex" flexDirection="column" gap="16px">
              <TextField
                label="Full Name"
                name="person_name"
                value={formData.person_name}
                onChange={handleChange}
                required
                fullWidth
                variant="filled"
              />
              
              <TextField
                label="Email"
                name="person_email"
                type="email"
                value={formData.person_email}
                onChange={handleChange}
                required
                fullWidth
                variant="filled"
              />
              
              <TextField
                label="Phone"
                name="person_phone"
                value={formData.person_phone}
                onChange={handleChange}
                fullWidth
                variant="filled"
              />
              
              <TextField
                label="Bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                multiline
                rows={4}
                fullWidth
                variant="filled"
                placeholder="Tell us about your research interests and background..."
              />
            </Box>
          </Box>

          <Box>
            <h3 style={{ color: colors.grey[100], marginBottom: '16px' }}>Expertise Areas</h3>
            <Box display="flex" flexDirection="column" gap="16px">
              <TextField
                label="Primary Expertise"
                name="expertise_1"
                value={formData.expertise_1}
                onChange={handleChange}
                fullWidth
                variant="filled"
              />
              
              <TextField
                label="Secondary Expertise"
                name="expertise_2"
                value={formData.expertise_2}
                onChange={handleChange}
                fullWidth
                variant="filled"
              />
              
              <TextField
                label="Tertiary Expertise"
                name="expertise_3"
                value={formData.expertise_3}
                onChange={handleChange}
                fullWidth
                variant="filled"
              />
            </Box>
          </Box>

          <Box>
            <h3 style={{ color: colors.grey[100], marginBottom: '16px' }}>Affiliation</h3>
            <Box display="flex" flexDirection="column" gap="16px">
              <TextField
                label="Institution"
                name="institution_name"
                value={formData.institution_name}
                onChange={handleChange}
                fullWidth
                variant="filled"
                placeholder="e.g., University of Southern Maine"
              />
              
              <TextField
                label="Department"
                name="department_name"
                value={formData.department_name}
                onChange={handleChange}
                fullWidth
                variant="filled"
                placeholder="e.g., Computer Science"
              />
            </Box>
          </Box>

          <Box display="flex" gap="16px" justifyContent="flex-end" mt="16px">
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              sx={{
                color: colors.grey[100],
                borderColor: colors.grey[400],
              }}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                backgroundColor: colors.greenAccent[600],
                color: colors.grey[100],
                '&:hover': { backgroundColor: colors.greenAccent[700] },
              }}
            >
              {loading ? 'Creating...' : 'Create Profile'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default CreateProfile;

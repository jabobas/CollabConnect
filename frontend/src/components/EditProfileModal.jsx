/*
Author: Aubin Mugisha
Date: December 7, 2025
Description: Modal for editing user profile information
*/

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
  Autocomplete,
  Typography
} from '@mui/material';
import { useTheme } from '@mui/material';
import { tokens } from '../theme';
import { MapPin, Building2 } from 'lucide-react';
import axios from 'axios';

const EditProfileModal = ({ open, onClose, person, department, institution, onProfileUpdated }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  const [formData, setFormData] = useState({
    person_name: '',
    person_email: '',
    person_phone: '',
    bio: '',
    expertise_1: '',
    expertise_2: '',
    expertise_3: '',
    department_name: '',
    institution_name: ''
  });
  
  const [allDepartments, setAllDepartments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch departments and institutions
    const fetchOptions = async () => {
      try {
        const [deptResponse, instResponse] = await Promise.all([
          axios.get('http://127.0.0.1:5001/department/all'),
          axios.get('http://127.0.0.1:5001/institution/all')
        ]);
        
        // Store all departments (with institution_id)
        const allDepts = deptResponse.data.data || [];
        setAllDepartments(allDepts);
        
        // Deduplicate departments by name for initial display
        const uniqueDepts = [];
        const seenDeptNames = new Set();
        allDepts.forEach(dept => {
          if (!seenDeptNames.has(dept.department_name)) {
            seenDeptNames.add(dept.department_name);
            uniqueDepts.push(dept);
          }
        });
        
        // Deduplicate institutions by name
        const uniqueInsts = [];
        const seenInstNames = new Set();
        (instResponse.data.data || []).forEach(inst => {
          if (!seenInstNames.has(inst.institution_name)) {
            seenInstNames.add(inst.institution_name);
            uniqueInsts.push(inst);
          }
        });
        
        setDepartments(uniqueDepts);
        setInstitutions(uniqueInsts);
      } catch (err) {
        console.error('Error fetching options:', err);
      }
    };
    
    fetchOptions();
  }, []);

  // Filter departments when institution is selected
  useEffect(() => {
    if (selectedInstitution) {
      // Filter departments that belong to the selected institution
      const filteredDepts = allDepartments.filter(
        dept => dept.institution_id === selectedInstitution.institution_id
      );
      
      // Deduplicate filtered departments
      const uniqueFilteredDepts = [];
      const seenNames = new Set();
      filteredDepts.forEach(dept => {
        if (!seenNames.has(dept.department_name)) {
          seenNames.add(dept.department_name);
          uniqueFilteredDepts.push(dept);
        }
      });
      
      setDepartments(uniqueFilteredDepts);
      
      // Clear department selection if it doesn't belong to the new institution
      setFormData(prev => {
        const currentDeptBelongsToInst = filteredDepts.some(
          dept => dept.department_name === prev.department_name
        );
        if (!currentDeptBelongsToInst) {
          return { ...prev, department_name: '' };
        }
        return prev;
      });
    } else {
      // Show all departments if no institution selected
      const uniqueDepts = [];
      const seenDeptNames = new Set();
      allDepartments.forEach(dept => {
        if (!seenDeptNames.has(dept.department_name)) {
          seenDeptNames.add(dept.department_name);
          uniqueDepts.push(dept);
        }
      });
      setDepartments(uniqueDepts);
    }
  }, [selectedInstitution, allDepartments]);

  useEffect(() => {
    if (person) {
      setFormData({
        person_name: person.person_name || '',
        person_email: person.person_email || '',
        person_phone: person.person_phone || '',
        bio: person.bio || '',
        expertise_1: person.expertise_1 || '',
        expertise_2: person.expertise_2 || '',
        expertise_3: person.expertise_3 || '',
        department_name: department?.department_name || '',
        institution_name: institution?.institution_name || ''
      });
    }
  }, [person, department, institution]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
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
      const token = localStorage.getItem('access_token');
      
      await axios.put(
        `http://127.0.0.1:5001/person/${person.person_id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      onProfileUpdated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: colors.primary[400],
          borderRadius: '16px'
        }
      }}
    >
      <DialogTitle sx={{ 
        color: colors.grey[100],
        fontSize: '24px',
        fontWeight: 700,
        pb: 2
      }}>
        Edit Profile
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                backgroundColor: colors.redAccent[800],
                color: colors.grey[100]
              }}
            >
              {error}
            </Alert>
          )}

          <Box display="flex" flexDirection="column" gap={2.5}>
            <TextField
              label="Full Name *"
              name="person_name"
              value={formData.person_name}
              onChange={handleChange}
              required
              fullWidth
              variant="filled"
              sx={{
                '& .MuiFilledInput-root': {
                  backgroundColor: colors.primary[500],
                  borderRadius: '8px'
                }
              }}
            />

            <TextField
              label="Email *"
              name="person_email"
              type="email"
              value={formData.person_email}
              onChange={handleChange}
              required
              fullWidth
              variant="filled"
              sx={{
                '& .MuiFilledInput-root': {
                  backgroundColor: colors.primary[500],
                  borderRadius: '8px'
                }
              }}
            />

            <TextField
              label="Phone"
              name="person_phone"
              value={formData.person_phone}
              onChange={handleChange}
              fullWidth
              variant="filled"
              sx={{
                '& .MuiFilledInput-root': {
                  backgroundColor: colors.primary[500],
                  borderRadius: '8px'
                }
              }}
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
              sx={{
                '& .MuiFilledInput-root': {
                  backgroundColor: colors.primary[500],
                  borderRadius: '8px'
                }
              }}
            />

            <Box>
              <h4 style={{ 
                color: colors.grey[100], 
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '12px',
                marginTop: '8px'
              }}>
                Affiliation
              </h4>
              
              <Box display="flex" flexDirection="column" gap={2}>
                <Autocomplete
                  freeSolo
                  options={institutions}
                  value={selectedInstitution}
                  onChange={(event, newValue) => {
                    setSelectedInstitution(newValue);
                    if (newValue && typeof newValue === 'object') {
                      setFormData({ ...formData, institution_name: newValue.institution_name });
                    } else {
                      setFormData({ ...formData, institution_name: '' });
                    }
                  }}
                  getOptionLabel={(option) => 
                    typeof option === 'string' ? option : option.institution_name
                  }
                  inputValue={formData.institution_name}
                  onInputChange={(event, newInputValue) => {
                    setFormData({ ...formData, institution_name: newInputValue });
                    // Clear selected institution if user types freely
                    if (event?.type === 'change') {
                      setSelectedInstitution(null);
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Institution"
                      variant="filled"
                      placeholder="Type or select an institution..."
                      sx={{
                        '& .MuiFilledInput-root': {
                          backgroundColor: colors.primary[500],
                          borderRadius: '8px'
                        }
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box
                      component="li"
                      {...props}
                      sx={{
                        px: 2,
                        py: 1.5,
                        borderRadius: '8px',
                        mx: 0.5,
                        my: 0.5,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: colors.greenAccent[800],
                          transform: 'translateX(4px)'
                        },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <Box>
                        <Typography sx={{ 
                          fontWeight: 600, 
                          color: colors.grey[100],
                          fontSize: '15px',
                          mb: 0.3
                        }}>
                          {option.institution_name}
                        </Typography>
                        {option.city && (
                          <Typography sx={{ 
                            fontSize: '13px', 
                            color: colors.grey[400],
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5
                          }}>
                            <MapPin size={12} />
                            {option.city}{option.state ? `, ${option.state}` : ''}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                />

                <Autocomplete
                  freeSolo
                  options={departments}
                  getOptionLabel={(option) => 
                    typeof option === 'string' ? option : option.department_name
                  }
                  inputValue={formData.department_name}
                  onInputChange={(event, newInputValue) => {
                    setFormData({ ...formData, department_name: newInputValue });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Department"
                      variant="filled"
                      placeholder="Type or select a department..."
                      sx={{
                        '& .MuiFilledInput-root': {
                          backgroundColor: colors.primary[500],
                          borderRadius: '8px'
                        }
                      }}
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box
                      component="li"
                      {...props}
                      sx={{
                        px: 2,
                        py: 1.5,
                        borderRadius: '8px',
                        mx: 0.5,
                        my: 0.5,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: colors.greenAccent[800],
                          transform: 'translateX(4px)'
                        },
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        cursor: 'pointer'
                      }}
                    >
                      <Building2 size={16} style={{ color: colors.grey[400] }} />
                      <Typography sx={{ 
                        fontWeight: 600, 
                        color: colors.grey[100],
                        fontSize: '15px'
                      }}>
                        {option.department_name}
                      </Typography>
                    </Box>
                  )}
                />
              </Box>
            </Box>

            <Box>
              <h4 style={{ 
                color: colors.grey[100], 
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '12px',
                marginTop: '8px'
              }}>
                Expertise Areas
              </h4>
              
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField
                  label="Primary Expertise"
                  name="expertise_1"
                  value={formData.expertise_1}
                  onChange={handleChange}
                  fullWidth
                  variant="filled"
                  sx={{
                    '& .MuiFilledInput-root': {
                      backgroundColor: colors.primary[500],
                      borderRadius: '8px'
                    }
                  }}
                />

                <TextField
                  label="Secondary Expertise"
                  name="expertise_2"
                  value={formData.expertise_2}
                  onChange={handleChange}
                  fullWidth
                  variant="filled"
                  sx={{
                    '& .MuiFilledInput-root': {
                      backgroundColor: colors.primary[500],
                      borderRadius: '8px'
                    }
                  }}
                />

                <TextField
                  label="Tertiary Expertise"
                  name="expertise_3"
                  value={formData.expertise_3}
                  onChange={handleChange}
                  fullWidth
                  variant="filled"
                  sx={{
                    '& .MuiFilledInput-root': {
                      backgroundColor: colors.primary[500],
                      borderRadius: '8px'
                    }
                  }}
                />
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button
            onClick={onClose}
            disabled={loading}
            sx={{
              color: colors.grey[100],
              px: 3,
              '&:hover': {
                backgroundColor: colors.primary[500]
              }
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : null}
            sx={{
              backgroundColor: colors.greenAccent[600],
              color: colors.grey[100],
              px: 3,
              fontWeight: 600,
              '&:hover': {
                backgroundColor: colors.greenAccent[700]
              }
            }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default EditProfileModal;

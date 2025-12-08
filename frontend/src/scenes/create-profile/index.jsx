/*
Author: Aubin Mugisha
Date: December 1, 2025

Create new researcher profile form. Allows users to manually enter their
information instead of claiming existing profile. Automatically links
created profile to their user account.
*/

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Button, TextField, useTheme, Alert, Card, 
  Stepper, Step, StepLabel, Divider, Chip, Autocomplete
} from "@mui/material";
import { User, Mail, Phone, FileText, Lightbulb, Building, CheckCircle, MapPin, Building2 } from "lucide-react";
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
  const steps = ['Basic Info', 'Expertise', 'Affiliation'];
  const [activeStep, setActiveStep] = useState(0);
  const [allDepartments, setAllDepartments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [selectedInstitution, setSelectedInstitution] = useState(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [deptResponse, instResponse] = await Promise.all([
          axios.get('/department/all'),
          axios.get('/institution/all')
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return formData.person_name && formData.person_email;
      case 1:
        return true; // Optional
      case 2:
        return true; // Optional
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    // Don't submit if not on last step
    if (activeStep < steps.length - 1) {
      return;
    }
    
    setError('');
    
    if (!formData.person_name || !formData.person_email) {
      setError('Name and email are required');
      return;
    }

    setLoading(true);
    
    try {
      const userId = localStorage.getItem('user_id');
      const token = localStorage.getItem('access_token');
      
      const response = await axios.post(
        '/user/create-profile-with-affiliation',
        formData,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.status === 'success') {
        const { person_id, access_token } = response.data.data;
        // Store person_id in localStorage for future use
        if (person_id) {
          localStorage.setItem('person_id', person_id);
        }
        // Update token with new one that includes person_id
        if (access_token) {
          localStorage.setItem('access_token', access_token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        }
        // Navigate to the person profile instead
        navigate(person_id ? `/person/${person_id}` : `/user/${userId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box m="20px">
      <Header 
        title="Create Your Profile" 
        subtitle="Set up your researcher profile to connect with collaborators"
      />

      <Card 
        component="div"
        sx={{
          maxWidth: "900px",
          mx: "auto",
          backgroundColor: colors.primary[400],
          borderRadius: "16px",
          p: 4,
          boxShadow: `0 4px 20px ${colors.primary[900]}40`
        }}
      >
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: '12px',
              backgroundColor: colors.redAccent[800],
              color: colors.grey[100]
            }}
          >
            {error}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel
                sx={{
                  '& .MuiStepLabel-label': {
                    color: colors.grey[300],
                    fontWeight: 600
                  },
                  '& .Mui-active': {
                    color: colors.blueAccent[500]
                  },
                  '& .Mui-completed': {
                    color: colors.greenAccent[500]
                  }
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Box>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <User size={28} color={colors.blueAccent[400]} />
              <h3 style={{ color: colors.grey[100], fontSize: '22px', fontWeight: '700', margin: 0 }}>
                Basic Information
              </h3>
            </Box>
            
            <Box display="flex" flexDirection="column" gap={3}>
              <TextField
                label="Full Name *"
                name="person_name"
                value={formData.person_name}
                onChange={handleChange}
                required
                fullWidth
                variant="filled"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                InputProps={{
                  startAdornment: <User size={18} style={{ marginRight: 8, color: colors.grey[400] }} />
                }}
                sx={{
                  '& .MuiFilledInput-root': {
                    backgroundColor: colors.primary[500],
                    borderRadius: '12px',
                    fontSize: '16px'
                  }
                }}
              />
              
              <TextField
                label="Email Address *"
                name="person_email"
                type="email"
                value={formData.person_email}
                onChange={handleChange}
                required
                fullWidth
                variant="filled"
                InputProps={{
                  startAdornment: <Mail size={18} style={{ marginRight: 8, color: colors.grey[400] }} />
                }}
                sx={{
                  '& .MuiFilledInput-root': {
                    backgroundColor: colors.primary[500],
                    borderRadius: '12px',
                    fontSize: '16px'
                  }
                }}
              />
              
              <TextField
                label="Phone Number"
                name="person_phone"
                value={formData.person_phone}
                onChange={handleChange}
                fullWidth
                variant="filled"
                InputProps={{
                  startAdornment: <Phone size={18} style={{ marginRight: 8, color: colors.grey[400] }} />
                }}
                sx={{
                  '& .MuiFilledInput-root': {
                    backgroundColor: colors.primary[500],
                    borderRadius: '12px',
                    fontSize: '16px'
                  }
                }}
              />
              
              <TextField
                label="Professional Bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                multiline
                rows={4}
                fullWidth
                variant="filled"
                placeholder="Tell us about your research interests, background, and what you're looking to collaborate on..."
                InputProps={{
                  startAdornment: <FileText size={18} style={{ marginRight: 8, marginTop: 8, color: colors.grey[400] }} />
                }}
                sx={{
                  '& .MuiFilledInput-root': {
                    backgroundColor: colors.primary[500],
                    borderRadius: '12px',
                    fontSize: '16px'
                  }
                }}
              />
            </Box>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Lightbulb size={28} color={colors.blueAccent[400]} />
              <h3 style={{ color: colors.grey[100], fontSize: '22px', fontWeight: '700', margin: 0 }}>
                Your Expertise
              </h3>
            </Box>
            
            <p style={{ color: colors.grey[300], marginBottom: '24px', fontSize: '15px' }}>
              Add up to three areas of expertise to help others find you for collaboration
            </p>

            <Box display="flex" flexDirection="column" gap={3}>
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
                    borderRadius: '12px',
                    fontSize: '16px'
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
                    borderRadius: '12px',
                    fontSize: '16px'
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
                    borderRadius: '12px',
                    fontSize: '16px'
                  }
                }}
              />
            </Box>
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
              <Building size={28} color={colors.blueAccent[400]} />
              <h3 style={{ color: colors.grey[100], fontSize: '22px', fontWeight: '700', margin: 0 }}>
                Institutional Affiliation
              </h3>
            </Box>

            <p style={{ color: colors.grey[300], marginBottom: '24px', fontSize: '15px' }}>
              Let others know where you work or study
            </p>

            <Box display="flex" flexDirection="column" gap={3}>
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
                    label="Institution Name"
                    name="institution_name"
                    fullWidth
                    variant="filled"
                    sx={{
                      '& .MuiFilledInput-root': {
                        backgroundColor: colors.primary[500],
                        borderRadius: '12px',
                        fontSize: '16px'
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
                      <Box sx={{ 
                        fontWeight: 600, 
                        color: colors.grey[100],
                        fontSize: '15px',
                        mb: 0.3
                      }}>
                        {option.institution_name}
                      </Box>
                      {option.city && (
                        <Box sx={{ 
                          fontSize: '13px', 
                          color: colors.grey[400],
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5
                        }}>
                          <MapPin size={12} />
                          {option.city}{option.state ? `, ${option.state}` : ''}
                        </Box>
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
                    label="Department/School"
                    name="department_name"
                    fullWidth
                    variant="filled"
                    sx={{
                      '& .MuiFilledInput-root': {
                        backgroundColor: colors.primary[500],
                        borderRadius: '12px',
                        fontSize: '16px'
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
                    <Box sx={{ 
                      fontWeight: 600, 
                      color: colors.grey[100],
                      fontSize: '15px'
                    }}>
                      {option.department_name}
                    </Box>
                  </Box>
                )}
              />
            </Box>

            <Divider sx={{ borderColor: colors.primary[300], my: 4 }} />

            <Box 
              sx={{
                backgroundColor: colors.blueAccent[900],
                borderRadius: '12px',
                p: 3,
                border: `2px solid ${colors.blueAccent[700]}`
              }}
            >
              <h4 style={{ color: colors.blueAccent[300], margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600 }}>
                Review Your Information
              </h4>
              <Box display="flex" flexDirection="column" gap={1.5}>
                <div style={{ color: colors.grey[300], fontSize: '14px' }}>
                  <strong>Name:</strong> {formData.person_name || 'Not provided'}
                </div>
                <div style={{ color: colors.grey[300], fontSize: '14px' }}>
                  <strong>Email:</strong> {formData.person_email || 'Not provided'}
                </div>
                {formData.person_phone && (
                  <div style={{ color: colors.grey[300], fontSize: '14px' }}>
                    <strong>Phone:</strong> {formData.person_phone}
                  </div>
                )}
                {(formData.expertise_1 || formData.expertise_2 || formData.expertise_3) && (
                  <Box mt={1}>
                    <strong style={{ color: colors.grey[300], fontSize: '14px' }}>Expertise:</strong>
                    <Box display="flex" flexWrap="wrap" gap={1} mt={1}>
                      {[formData.expertise_1, formData.expertise_2, formData.expertise_3]
                        .filter(Boolean)
                        .map((exp, idx) => (
                          <Chip key={idx} label={exp} size="small" sx={{ backgroundColor: colors.blueAccent[700] }} />
                        ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Box>
          </Box>
        )}

        <Divider sx={{ borderColor: colors.primary[300], my: 4 }} />

        <Box display="flex" gap={2} justifyContent="space-between">
          <Button
            variant="outlined"
            onClick={() => activeStep === 0 ? navigate(-1) : setActiveStep(activeStep - 1)}
            sx={{
              color: colors.grey[100],
              borderColor: colors.grey[400],
              px: 3,
              py: 1.5,
              borderRadius: '12px',
              fontWeight: 600,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2
              }
            }}
          >
            {activeStep === 0 ? 'Cancel' : 'Back'}
          </Button>
          
          {activeStep < steps.length - 1 ? (
            <Button
              type="button"
              variant="contained"
              onClick={() => setActiveStep(activeStep + 1)}
              disabled={!isStepValid()}
              sx={{
                backgroundColor: colors.blueAccent[600],
                color: colors.grey[100],
                px: 4,
                py: 1.5,
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                '&:hover': { backgroundColor: colors.blueAccent[700] }
              }}
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              variant="contained"
              onClick={handleSubmit}
              disabled={loading || !isStepValid()}
              startIcon={loading ? null : <CheckCircle size={18} />}
              sx={{
                backgroundColor: colors.greenAccent[600],
                color: colors.grey[100],
                px: 4,
                py: 1.5,
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: 600,
                '&:hover': { backgroundColor: colors.greenAccent[700] }
              }}
            >
              {loading ? 'Creating Profile...' : 'Create Profile'}
            </Button>
          )}
        </Box>
      </Card>
    </Box>
  );
};

export default CreateProfile;

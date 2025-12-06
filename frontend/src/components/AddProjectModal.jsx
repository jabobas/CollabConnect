import React, { useState } from 'react';
import { Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from "@mui/material";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";
import axios from "axios";

const AddProjectModal = ({ open, onClose, userId, onProjectAdded }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  const [formData, setFormData] = useState({
    project_title: '',
    project_description: '',
    project_role: '',
    tag_name: '',
    start_date: '',
    end_date: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.project_title) {
      setError('Project title is required');
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.post(
        `/user/${userId}/projects`,
        formData,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.status === 'success') {
        setFormData({
          project_title: '',
          project_description: '',
          project_role: '',
          tag_name: '',
          start_date: '',
          end_date: ''
        });
        onProjectAdded();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add project');
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
        style: {
          backgroundColor: colors.primary[400],
          borderRadius: '12px'
        }
      }}
    >
      <DialogTitle style={{ color: colors.grey[100], fontSize: '24px', fontWeight: '600' }}>
        Add New Project
      </DialogTitle>
      
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap="20px" mt="10px">
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Project Title"
            name="project_title"
            value={formData.project_title}
            onChange={handleChange}
            required
            fullWidth
            variant="filled"
          />
          
          <TextField
            label="Description"
            name="project_description"
            value={formData.project_description}
            onChange={handleChange}
            multiline
            rows={4}
            fullWidth
            variant="filled"
            placeholder="Describe the project goals and outcomes..."
          />

          <TextField
            label="Your Role"
            name="project_role"
            value={formData.project_role}
            onChange={handleChange}
            fullWidth
            variant="filled"
            placeholder="e.g., Principal Investigator, Researcher, Developer"
          />
          
          <TextField
            label="Tag/Category"
            name="tag_name"
            value={formData.tag_name}
            onChange={handleChange}
            fullWidth
            variant="filled"
            placeholder="e.g., Machine Learning, Web Development"
          />

          <Box display="flex" gap="16px">
            <TextField
              label="Start Date"
              name="start_date"
              type="date"
              value={formData.start_date}
              onChange={handleChange}
              fullWidth
              variant="filled"
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              label="End Date"
              name="end_date"
              type="date"
              value={formData.end_date}
              onChange={handleChange}
              fullWidth
              variant="filled"
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions style={{ padding: '16px 24px' }}>
        <Button
          onClick={onClose}
          sx={{
            color: colors.grey[100],
            '&:hover': { backgroundColor: colors.primary[300] }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          variant="contained"
          sx={{
            backgroundColor: colors.greenAccent[600],
            color: colors.grey[100],
            '&:hover': { backgroundColor: colors.greenAccent[700] }
          }}
        >
          {loading ? 'Adding...' : 'Add Project'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddProjectModal;

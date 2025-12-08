/**
 * Author: Aubin Mugisha
 * EditProjectModal - Modal for editing and deleting projects with ownership verification
 */

import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert, IconButton } from "@mui/material";
import { useTheme } from "@mui/material";
import { Trash2 } from "lucide-react";
import { tokens } from "../theme";
import axios from "axios";

const EditProjectModal = ({ open, onClose, project, userId, onProjectUpdated, onProjectDeleted }) => {
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (project) {
      const formatDate = (dateStr) => {
        if (!dateStr || dateStr === 'null') return '';
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
        
        try {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return '';
          return date.toISOString().split('T')[0];
        } catch {
          return '';
        }
      };
      
      setFormData({
        project_title: project.project_title || '',
        project_description: project.project_description || '',
        project_role: project.project_role || '',
        tag_name: project.tag_name || '',
        start_date: formatDate(project.start_date),
        end_date: formatDate(project.end_date)
      });
    }
  }, [project]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleMarkAsEnded = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({ ...formData, end_date: today });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.project_title) {
      setError('Project title is required');
      return;
    }

    if (formData.start_date && formData.end_date) {
      if (new Date(formData.end_date) < new Date(formData.start_date)) {
        setError('End date must be after start date');
        return;
      }
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('access_token');
      const projectData = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      };
      
      const response = await axios.put(
        `/project/${project.project_id}`,
        projectData,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.status === 'success') {
        onProjectUpdated();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.delete(
        `/project/${project.project_id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.data.status === 'success') {
        onProjectDeleted();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete project');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!project) return null;

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
      <DialogTitle style={{ 
        color: colors.grey[100], 
        fontSize: '24px', 
        fontWeight: '600',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        Edit Project
        <IconButton 
          onClick={() => setShowDeleteConfirm(true)}
          sx={{ 
            color: colors.redAccent[500],
            '&:hover': { backgroundColor: colors.redAccent[800] }
          }}
          title="Delete Project"
        >
          <Trash2 size={20} />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap="20px" mt="10px">
          {error && <Alert severity="error">{error}</Alert>}

          {showDeleteConfirm && (
            <Alert 
              severity="warning"
              action={
                <Box display="flex" gap="8px">
                  <Button 
                    size="small" 
                    onClick={handleDelete}
                    disabled={loading}
                    sx={{ color: colors.redAccent[400] }}
                  >
                    Delete
                  </Button>
                  <Button 
                    size="small" 
                    onClick={() => setShowDeleteConfirm(false)}
                    sx={{ color: colors.grey[300] }}
                  >
                    Cancel
                  </Button>
                </Box>
              }
            >
              Are you sure you want to delete this project? This action cannot be undone.
            </Alert>
          )}

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
            
            <Box flex={1}>
              <TextField
                label="End Date (Optional)"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleChange}
                fullWidth
                variant="filled"
                InputLabelProps={{ shrink: true }}
                helperText="Leave empty for ongoing projects"
              />
              {!formData.end_date && (
                <Button
                  size="small"
                  onClick={handleMarkAsEnded}
                  sx={{
                    mt: 1,
                    color: colors.blueAccent[400],
                    fontSize: '12px',
                    textTransform: 'none'
                  }}
                >
                  Mark as Ended Today
                </Button>
              )}
            </Box>
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
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProjectModal;

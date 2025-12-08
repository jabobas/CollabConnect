/*
 * Author: Aubin Mugisha
 * Description: Modal component for deleting user accounts with confirmation and password verification.
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Alert,
  Typography,
  TextField,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material';
import { tokens } from '../theme';
import { AlertTriangle } from 'lucide-react';
import axios from 'axios';

const DeleteAccountModal = ({ open, onClose, personId, personName, onAccountDeleted }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type DELETE to confirm');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      
      await axios.delete(
        `http://127.0.0.1:5001/person/${personId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Clear local storage and authentication
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('person_id');
      delete axios.defaults.headers.common['Authorization'];
      
      // Show success state
      setConfirmText('');
      setError('');
      setSuccess(true);
      setLoading(false);
      
      // Notify other components about auth state change
      window.dispatchEvent(new Event('authChange'));
      
      // Redirect to login after brief delay
      setTimeout(() => {
        onAccountDeleted();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account');
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading && !success) {
      setConfirmText('');
      setError('');
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: colors.primary[400],
          borderRadius: '16px',
          border: `2px solid ${colors.redAccent[500]}`
        }
      }}
    >
      <DialogTitle sx={{ 
        color: colors.redAccent[500],
        fontSize: '24px',
        fontWeight: 700,
        pb: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <AlertTriangle size={28} />
        Delete Account
      </DialogTitle>
      
      <DialogContent>
        {success && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 2,
              backgroundColor: colors.greenAccent[800],
              color: colors.grey[100]
            }}
          >
            Account deleted successfully! Redirecting to login page...
          </Alert>
        )}
        
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

        {!success && <Box display="flex" flexDirection="column" gap={2.5}>
          <Alert 
            severity="warning"
            sx={{
              backgroundColor: colors.redAccent[900],
              color: colors.grey[100],
              '& .MuiAlert-icon': {
                color: colors.redAccent[400]
              }
            }}
          >
            <Typography variant="body1" fontWeight={600} mb={1}>
              Important: Understand what will happen
            </Typography>
            <Typography variant="body2" mb={1}>
              Deleting your account will:
            </Typography>
            <ul style={{ marginTop: '8px', marginBottom: '12px', paddingLeft: '20px' }}>
              <li>Remove your login credentials and authentication</li>
              <li>Unclaim your profile</li>
            </ul>
            <Typography variant="body2" fontWeight={600} color={colors.greenAccent[400]}>
              Your profile data will be preserved:
            </Typography>
            <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
              <li>Profile information remains in the research directory</li>
              <li>Projects and collaborations stay visible to others</li>
              <li>You can reclaim this profile by creating a new account</li>
            </ul>
          </Alert>

          <Box>
            <Typography 
              variant="body1" 
              color={colors.grey[100]} 
              mb={1}
              fontWeight={500}
            >
              You are about to delete the account for:
            </Typography>
            <Typography 
              variant="h5" 
              color={colors.redAccent[400]} 
              fontWeight={700}
              mb={2}
            >
              {personName}
            </Typography>

            <Typography 
              variant="body2" 
              color={colors.grey[300]} 
              mb={1.5}
            >
              Type <strong style={{ color: colors.redAccent[400] }}>DELETE</strong> to confirm:
            </Typography>
            
            <TextField
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE here"
              fullWidth
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: colors.primary[300] },
                  '&:hover fieldset': { borderColor: colors.redAccent[500] },
                },
                '& .MuiInputLabel-root': { color: colors.grey[100] },
                '& .MuiInputBase-input': { color: colors.grey[100] },
              }}
            />
          </Box>
        </Box>}
      </DialogContent>

      {!success && <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button
          onClick={handleClose}
          disabled={loading}
          sx={{
            color: colors.grey[100],
            px: 3,
            fontWeight: 600,
            '&:hover': {
              backgroundColor: colors.primary[500]
            }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          disabled={loading || confirmText !== 'DELETE'}
          startIcon={loading ? <CircularProgress size={18} /> : <AlertTriangle size={18} />}
          sx={{
            backgroundColor: colors.redAccent[600],
            color: colors.grey[100],
            px: 3,
            fontWeight: 600,
            '&:hover': {
              backgroundColor: colors.redAccent[700]
            },
            '&.Mui-disabled': {
              backgroundColor: colors.grey[700],
              color: colors.grey[500]
            }
          }}
        >
          {loading ? 'Deleting...' : 'Delete Account'}
        </Button>
      </DialogActions>}
    </Dialog>
  );
};

export default DeleteAccountModal;

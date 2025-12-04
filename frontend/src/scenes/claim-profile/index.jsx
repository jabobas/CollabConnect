/*
Author: Aubin Mugisha
Date: December 2, 2025

Profile claiming page where users can search for existing Person profiles
from scraped data and claim them to link to their user account.
*/

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, useTheme, CircularProgress, Alert, Chip } from "@mui/material";
import { Search, User, Mail, Phone, CheckCircle, XCircle } from "lucide-react";
import axios from "axios";
import Header from "../../components/Header";
import { tokens } from "../../theme";

const ClaimProfile = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [claimingId, setClaimingId] = useState(null);

  const handleSearch = async () => {
    if (!searchName && !searchEmail) {
      setError('Please enter a name or email to search');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await axios.get('/user/search-profile', {
        params: { name: searchName, email: searchEmail }
      });

      if (response.data.status === 'success') {
        setResults(response.data.data);
        if (response.data.data.length === 0) {
          setError('No matching profiles found. Try different search terms or create a new profile.');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (personId) => {
    const userId = localStorage.getItem('user_id');
    const token = localStorage.getItem('access_token');

    if (!userId || !token) {
      setError('Please log in to claim a profile');
      return;
    }

    setClaimingId(personId);

    try {
      const response = await axios.post(
        `/user/${userId}/claim-person/${personId}`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.data.status === 'success') {
        navigate(`/user/${userId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to claim profile');
      setClaimingId(null);
    }
  };

  const ProfileCard = ({ profile }) => (
    <Box
      backgroundColor={colors.primary[400]}
      borderRadius="8px"
      border={`1px solid ${colors.primary[300]}`}
      p="24px"
      sx={{
        opacity: profile.is_claimed ? 0.6 : 1,
        transition: 'all 0.2s'
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="start" mb="16px">
        <Box flex={1}>
          <h3 style={{ color: colors.grey[100], fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
            {profile.person_name}
          </h3>
          
          {profile.bio && (
            <p style={{ 
              color: colors.grey[300], 
              fontSize: '14px', 
              marginBottom: '12px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
              {profile.bio}
            </p>
          )}
        </Box>

        <Box ml="16px">
          {profile.is_claimed ? (
            <Chip
              icon={<XCircle size={16} />}
              label="Already Claimed"
              size="small"
              sx={{ 
                backgroundColor: colors.redAccent[700],
                color: colors.grey[100]
              }}
            />
          ) : (
            <Chip
              icon={<CheckCircle size={16} />}
              label="Available"
              size="small"
              sx={{ 
                backgroundColor: colors.greenAccent[700],
                color: colors.grey[100]
              }}
            />
          )}
        </Box>
      </Box>

      <Box display="flex" flexDirection="column" gap="8px" mb="16px">
        {profile.person_email && (
          <Box display="flex" alignItems="center" gap="8px">
            <Mail size={16} color={colors.grey[400]} />
            <span style={{ color: colors.grey[300], fontSize: '14px' }}>{profile.person_email}</span>
          </Box>
        )}

        {profile.person_phone && (
          <Box display="flex" alignItems="center" gap="8px">
            <Phone size={16} color={colors.grey[400]} />
            <span style={{ color: colors.grey[300], fontSize: '14px' }}>{profile.person_phone}</span>
          </Box>
        )}
      </Box>

      {profile.expertises && profile.expertises.length > 0 && (
        <Box display="flex" flexWrap="wrap" gap="8px" mb="16px">
          {profile.expertises.map((exp, idx) => (
            <Chip
              key={idx}
              label={exp}
              size="small"
              sx={{ 
                backgroundColor: colors.blueAccent[700],
                color: colors.grey[100],
                fontSize: '12px'
              }}
            />
          ))}
        </Box>
      )}

      <Button
        variant="contained"
        fullWidth
        disabled={profile.is_claimed || claimingId === profile.person_id}
        onClick={() => handleClaim(profile.person_id)}
        sx={{
          backgroundColor: profile.is_claimed ? colors.grey[700] : colors.greenAccent[600],
          color: colors.grey[100],
          '&:hover': { 
            backgroundColor: profile.is_claimed ? colors.grey[700] : colors.greenAccent[700]
          },
          '&:disabled': {
            backgroundColor: colors.grey[700],
            color: colors.grey[400]
          }
        }}
      >
        {claimingId === profile.person_id ? 'Claiming...' : profile.is_claimed ? 'Already Claimed' : 'Claim This Profile'}
      </Button>
    </Box>
  );

  return (
    <Box m="20px">
      <Header 
        title="Search & Claim Profile" 
        subtitle="Find your existing profile from our database and claim it"
      />

      <Box 
        backgroundColor={colors.primary[400]}
        borderRadius="8px"
        p="32px"
        mb="32px"
      >
        {error && <Alert severity="error" sx={{ mb: '20px' }}>{error}</Alert>}

        <Box display="flex" gap="16px" mb="20px" flexWrap="wrap">
          <TextField
            label="Search by Name"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            variant="filled"
            sx={{ flex: 1, minWidth: '250px' }}
            placeholder="e.g., John Smith"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />

          <TextField
            label="Search by Email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            variant="filled"
            sx={{ flex: 1, minWidth: '250px' }}
            placeholder="e.g., john@example.com"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />

          <Button
            variant="contained"
            startIcon={loading ? <CircularProgress size={18} /> : <Search size={18} />}
            onClick={handleSearch}
            disabled={loading}
            sx={{
              backgroundColor: colors.blueAccent[700],
              color: colors.grey[100],
              padding: '14px 32px',
              '&:hover': { backgroundColor: colors.blueAccent[800] }
            }}
          >
            Search
          </Button>
        </Box>

        <Box display="flex" justifyContent="center">
          <Button
            variant="outlined"
            startIcon={<User size={18} />}
            onClick={() => navigate('/create-profile')}
            sx={{
              borderColor: colors.greenAccent[700],
              color: colors.greenAccent[700],
              '&:hover': { 
                borderColor: colors.greenAccent[600],
                backgroundColor: colors.greenAccent[700] + '20'
              }
            }}
          >
            Or Create New Profile Instead
          </Button>
        </Box>
      </Box>

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      )}

      {!loading && results.length > 0 && (
        <>
          <h3 style={{ 
            color: colors.grey[100], 
            fontSize: '20px', 
            fontWeight: '600',
            marginBottom: '20px'
          }}>
            Search Results ({results.length})
          </h3>

          <Box 
            display="grid" 
            gridTemplateColumns="repeat(auto-fill, minmax(400px, 1fr))" 
            gap="20px"
          >
            {results.map((profile) => (
              <ProfileCard key={profile.person_id} profile={profile} />
            ))}
          </Box>
        </>
      )}
    </Box>
  );
};

export default ClaimProfile;

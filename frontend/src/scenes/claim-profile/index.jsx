/*
 * Author: Aubin Mugisha & Copilot
 * Description: Profile claiming page allowing users to link their account to existing researcher profiles.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, TextField, Button, useTheme, CircularProgress, 
  Alert, Chip, Autocomplete, Card, CardContent, Avatar, Divider, Typography
} from "@mui/material";
import { Search, User, Mail, Phone, CheckCircle, XCircle, Briefcase, Sparkles } from "lucide-react";
import axios from "axios";
import Header from "../../components/Header";
import { tokens } from "../../theme";

const ClaimProfile = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  
  const [searchName, setSearchName] = useState('');
  const [allPeople, setAllPeople] = useState([]);
  const [filteredPeople, setFilteredPeople] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [claimingId, setClaimingId] = useState(null);
  const [loadingPeople, setLoadingPeople] = useState(true);

  const fetchAllPeople = async () => {
    setLoadingPeople(true);
    try {
      const response = await axios.get('/person/all');
      if (response.data.status === 'success') {
        setAllPeople(response.data.data);
      }
    } catch (err) {
      setError('Failed to load profiles');
    } finally {
      setLoadingPeople(false);
    }
  };

  useEffect(() => {
    fetchAllPeople();
  }, []);

  useEffect(() => {
    if (searchName.length >= 2) {
      const filtered = allPeople.filter(person =>
        person.person_name.toLowerCase().includes(searchName.toLowerCase()) ||
        person.person_email?.toLowerCase().includes(searchName.toLowerCase())
      );
      setFilteredPeople(filtered.slice(0, 50));
    } else {
      setFilteredPeople([]);
    }
  }, [searchName, allPeople]);

  const handleClaim = async (personId) => {
    const userId = localStorage.getItem('user_id');
    const token = localStorage.getItem('access_token');

    if (!userId || !token) {
      setError('Please log in to claim a profile');
      return;
    }

    setClaimingId(personId);
    setError('');
    setSuccess(false);

    try {
      const response = await axios.post(
        `/user/${userId}/claim-person/${personId}`,
        {},
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const { person_id, access_token } = response.data.data;
      localStorage.setItem('person_id', person_id);
      if (access_token) {
        localStorage.setItem('access_token', access_token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      }
      
      // Reset claiming state and show success
      setClaimingId(null);
      setSuccess(true);
      
      // Scroll to top to show success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Navigate after showing success message
      setTimeout(() => {
        navigate(`/person/${person_id}`);
      }, 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to claim profile');
      setClaimingId(null);
      setSuccess(false);
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const ProfileCard = ({ profile }) => {
    const initials = profile.person_name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const expertiseList = useMemo(
      () => (profile.expertises || []).filter(Boolean),
      [profile.expertises]
    );

    return (
      <Card
        sx={{
          backgroundColor: colors.primary[400],
          height: "100%",
          display: "flex",
          flexDirection: "column",
          borderRadius: "12px",
          border: `1px solid ${profile.is_claimed ? colors.redAccent[700] : colors.primary[300]}`,
          transition: "all 0.3s",
          opacity: profile.is_claimed ? 0.8 : 1,
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: profile.is_claimed 
              ? `0 12px 24px -10px ${colors.redAccent[700]}`
              : `0 12px 24px -10px ${colors.greenAccent[700]}`,
            borderColor: profile.is_claimed ? colors.redAccent[500] : colors.greenAccent[500],
          },
        }}
      >
        <CardContent sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column" }}>
          <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
            <Avatar
              sx={{
                bgcolor: profile.is_claimed ? colors.redAccent[600] : colors.greenAccent[600],
                width: 56,
                height: 56,
                fontSize: "1.5rem",
                fontWeight: 700,
                boxShadow: profile.is_claimed 
                  ? `0 4px 12px ${colors.redAccent[700]}50`
                  : `0 4px 12px ${colors.greenAccent[700]}50`,
              }}
            >
              {initials}
            </Avatar>

            <Box flex={1} minWidth={0}>
              <Box display="flex" justifyContent="space-between" alignItems="start" mb={0.5}>
                <Typography
                  variant="h6"
                  fontWeight="600"
                  color={colors.grey[100]}
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                    mr: 1
                  }}
                >
                  {profile.person_name}
                </Typography>
                
                {profile.is_claimed ? (
                  <Chip
                    icon={<XCircle size={14} />}
                    label="Claimed"
                    size="small"
                    sx={{ 
                      height: 24,
                      backgroundColor: colors.redAccent[700],
                      color: colors.grey[100],
                      fontWeight: 600,
                      fontSize: "0.7rem"
                    }}
                  />
                ) : (
                  <Chip
                    icon={<Sparkles size={14} />}
                    label="Available"
                    size="small"
                    sx={{ 
                      height: 24,
                      backgroundColor: colors.greenAccent[700],
                      color: colors.grey[100],
                      fontWeight: 600,
                      fontSize: "0.7rem"
                    }}
                  />
                )}
              </Box>

              {profile.main_field && profile.main_field !== "main_field" && (
                <Chip
                  label={profile.main_field}
                  size="small"
                  sx={{
                    height: 24,
                    backgroundColor: colors.blueAccent[700],
                    color: colors.grey[100],
                    fontWeight: 500,
                    fontSize: "0.75rem",
                  }}
                />
              )}
            </Box>
          </Box>

          {profile.bio && (
            <Box mb={2}>
              <Typography
                variant="body2"
                color={colors.grey[300]}
                sx={{
                  fontSize: "0.85rem",
                  lineHeight: 1.5,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {profile.bio}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 1.5, borderColor: colors.primary[300] }} />

          {expertiseList.length > 0 && (
            <Box mb={2}>
              <Typography
                variant="caption"
                color={colors.primary[100]}
                fontWeight={700}
                display="block"
                fontSize="12px"
                mb={1}
              >
                Expertise:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {expertiseList.slice(0, 3).map((exp, idx) => (
                  <Chip
                    key={idx}
                    label={exp}
                    size="small"
                    sx={{
                      height: 22,
                      backgroundColor: colors.greenAccent[800],
                      color: colors.grey[100],
                      fontSize: "0.7rem",
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          <Box display="flex" flexDirection="column" gap={1} mb={2}>
            {profile.person_email && (
              <Box display="flex" alignItems="center" gap={1}>
                <Mail size={16} color={colors.greenAccent[400]} />
                <Typography
                  variant="caption"
                  color={colors.grey[200]}
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: "bold",
                  }}
                  fontSize={10}
                >
                  {profile.person_email}
                </Typography>
              </Box>
            )}
            
            {profile.person_phone && (
              <Box display="flex" alignItems="center" gap={1}>
                <Phone size={16} color={colors.greenAccent[400]} />
                <Typography variant="caption" fontSize={10} color={colors.grey[200]} fontWeight="bold">
                  {profile.person_phone}
                </Typography>
              </Box>
            )}

            {profile.department_name && (
              <Box display="flex" alignItems="center" gap={1}>
                <Briefcase size={16} color={colors.blueAccent[400]} />
                <Typography variant="caption" fontSize={10} color={colors.grey[200]} fontWeight="bold">
                  {profile.department_name}
                </Typography>
              </Box>
            )}
          </Box>

          <Button
            variant="contained"
            fullWidth
            disabled={profile.is_claimed || claimingId === profile.person_id}
            onClick={() => handleClaim(profile.person_id)}
            startIcon={claimingId === profile.person_id ? <CircularProgress size={16} /> : profile.is_claimed ? <XCircle size={16} /> : <CheckCircle size={16} />}
            sx={{
              backgroundColor: profile.is_claimed ? colors.grey[700] : colors.greenAccent[600],
              color: colors.grey[100],
              py: 1.2,
              fontSize: "14px",
              fontWeight: 600,
              borderRadius: "8px",
              mt: "auto",
              "&:hover": { 
                backgroundColor: profile.is_claimed ? colors.grey[700] : colors.greenAccent[700]
              },
              "&:disabled": {
                backgroundColor: colors.grey[700],
                color: colors.grey[400],
                cursor: "not-allowed"
              }
            }}
          >
            {claimingId === profile.person_id ? "Claiming..." : profile.is_claimed ? "Already Claimed" : "Claim This Profile"}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box m="20px">
      <Header 
        title="Search & Claim Profile" 
        subtitle="Find your existing profile from our database and claim it"
      />

      <Alert 
        severity="info" 
        sx={{ 
          mb: 3,
          backgroundColor: colors.blueAccent[800],
          color: colors.grey[100],
          border: `1px solid ${colors.blueAccent[700]}`,
          borderRadius: '12px',
          '& .MuiAlert-icon': { color: colors.blueAccent[400] }
        }}
      >
        Profiles marked as "Already Claimed" are linked to other user accounts and cannot be claimed again.
      </Alert>

      <Card 
        sx={{
          backgroundColor: colors.primary[400],
          borderRadius: "16px",
          p: 4,
          mb: 4,
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

        {success && (
          <Alert 
            icon={<CheckCircle size={24} />}
            severity="success" 
            sx={{ 
              mb: 3,
              borderRadius: '12px',
              backgroundColor: colors.greenAccent[800],
              color: colors.grey[100],
              fontSize: '16px',
              fontWeight: 600,
              animation: 'slideDown 0.5s ease-out',
              '@keyframes slideDown': {
                from: {
                  opacity: 0,
                  transform: 'translateY(-20px)'
                },
                to: {
                  opacity: 1,
                  transform: 'translateY(0)'
                }
              }
            }}
          >
            <Box display="flex" flexDirection="column" gap={1}>
              <Box display="flex" alignItems="center" gap={1}>
                <Sparkles size={20} color={colors.greenAccent[400]} />
                <span>Profile Successfully Claimed!</span>
              </Box>
              <span style={{ fontSize: '14px', fontWeight: 400, color: colors.grey[200] }}>
                Redirecting you to your profile page...
              </span>
            </Box>
          </Alert>
        )}

        <Box mb={3}>
          <Autocomplete
            freeSolo
            options={filteredPeople}
            getOptionLabel={(option) => 
              typeof option === 'string' ? option : option.person_name
            }
            value={selectedProfile}
            onChange={(event, newValue) => {
              setSelectedProfile(newValue);
              if (newValue && typeof newValue !== 'string') {
                setSearchName(newValue.person_name);
              }
            }}
            inputValue={searchName}
            onInputChange={(event, newInputValue) => {
              setSearchName(newInputValue);
            }}
            loading={loadingPeople}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search by Name or Email"
                variant="filled"
                placeholder="Start typing to see suggestions..."
                InputProps={{
                  ...params.InputProps,
                  startAdornment: <Search size={20} style={{ marginRight: 8, color: colors.blueAccent[400] }} />,
                  endAdornment: (
                    <>
                      {loadingPeople ? <CircularProgress size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
                sx={{
                  '& .MuiFilledInput-root': {
                    backgroundColor: colors.primary[500],
                    borderRadius: '12px',
                    fontSize: '16px',
                    '&:hover': {
                      backgroundColor: colors.primary[600]
                    }
                  }
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box
                component="li"
                {...props}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 2,
                  '&:hover': {
                    backgroundColor: colors.primary[600]
                  }
                }}
              >
                <Avatar
                  sx={{
                    backgroundColor: colors.blueAccent[600],
                    width: 40,
                    height: 40
                  }}
                >
                  {option.person_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </Avatar>
                <Box>
                  <div style={{ fontWeight: 600, color: colors.grey[100] }}>
                    {option.person_name}
                  </div>
                  <div style={{ fontSize: '12px', color: colors.grey[400] }}>
                    {option.person_email || option.main_field || 'No email'}
                  </div>
                </Box>
                {option.is_claimed && (
                  <Chip
                    label="Already Claimed"
                    size="small"
                    sx={{
                      ml: 'auto',
                      backgroundColor: colors.redAccent[700],
                      color: colors.grey[100],
                      fontSize: '11px',
                      fontWeight: 600
                    }}
                  />
                )}
              </Box>
            )}
          />
        </Box>

        <Divider sx={{ borderColor: colors.primary[300], my: 3 }} />

        <Box display="flex" justifyContent="center">
          <Button
            variant="outlined"
            startIcon={<User size={18} />}
            onClick={() => navigate('/create-profile')}
            sx={{
              borderColor: colors.greenAccent[600],
              color: colors.greenAccent[600],
              px: 3,
              py: 1.5,
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: 600,
              borderWidth: 2,
              '&:hover': { 
                borderColor: colors.greenAccent[500],
                backgroundColor: colors.greenAccent[700] + '20',
                borderWidth: 2
              }
            }}
          >
            Or Create New Profile Instead
          </Button>
        </Box>
      </Card>

      {loadingPeople ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress size={50} />
        </Box>
      ) : selectedProfile && typeof selectedProfile !== 'string' ? (
        <Box>
          <h3 style={{ 
            color: colors.grey[100], 
            fontSize: '24px', 
            fontWeight: '700',
            marginBottom: '24px'
          }}>
            Selected Profile
          </h3>
          <ProfileCard profile={selectedProfile} />
        </Box>
      ) : filteredPeople.length > 0 && searchName.length >= 2 ? (
        <>
          <h3 style={{ 
            color: colors.grey[100], 
            fontSize: '24px', 
            fontWeight: '700',
            marginBottom: '24px'
          }}>
            Matching Profiles ({filteredPeople.length})
          </h3>

          <Box 
            display="grid" 
            gridTemplateColumns="repeat(auto-fill, minmax(420px, 1fr))" 
            gap={3}
          >
            {filteredPeople.slice(0, 12).map((profile) => (
              <ProfileCard key={profile.person_id} profile={profile} />
            ))}
          </Box>
        </>
      ) : searchName.length >= 2 ? (
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          minHeight="200px"
          gap={2}
        >
          <XCircle size={48} color={colors.grey[500]} />
          <p style={{ color: colors.grey[400], fontSize: '16px' }}>
            No profiles found. Try a different search or create a new profile.
          </p>
        </Box>
      ) : null}
    </Box>
  );
};

export default ClaimProfile;

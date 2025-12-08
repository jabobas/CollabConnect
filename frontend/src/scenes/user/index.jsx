/*
Author: Aubin Mugisha
Date: December 1, 2025

User profile page displaying user information and their projects.
Shows "Complete Your Profile" section for new users without linked person profile,
with options to search/claim existing profile or create new one.
*/

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Button, useTheme, CircularProgress, Chip } from "@mui/material";
import { Mail, Phone, Calendar, Award, User as UserIcon, Search, Plus } from "lucide-react";
import axios from "axios";
import Header from "../../components/Header";
import AddProjectModal from "../../components/AddProjectModal";
import { tokens } from "../../theme";

const User = () => {
  const { id } = useParams();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const userRes = await axios.get(`/user/${id}`);
        
        if (userRes.data.status === 'success') {
          const userData = userRes.data.data;
          setUser(userData);
          
          // If user has claimed a person profile, redirect to person page instead
          if (userData.person_id) {
            navigate(`/person/${userData.person_id}`, { replace: true });
            return;
          }
          
          // Try to fetch projects, but don't fail if user has no person_id yet
          try {
            const projectsRes = await axios.get(`/user/${id}/projects`);
            if (projectsRes.data.status === 'success') setProjects(projectsRes.data.data);
          } catch (projErr) {
            // 404 is expected for new users without person profile
            setProjects([]);
          }
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleProjectAdded = () => {
    const fetchProjects = async () => {
      try {
        const projectsRes = await axios.get(`/user/${id}/projects`);
        if (projectsRes.data.status === 'success') setProjects(projectsRes.data.data);
      } catch (err) {
        setProjects([]);
      }
    };
    fetchProjects();
  };

  if (loading) return <Box m="20px" display="flex" justifyContent="center" alignItems="center" height="80vh"><CircularProgress /></Box>;
  if (error) return <Box m="20px"><Header title="Error" subtitle={`Failed to load user: ${error}`} /></Box>;
  if (!user) return <Box m="20px"><Header title="Not Found" subtitle="User not found" /></Box>;

  const NoProfileSection = () => (
    <Box backgroundColor={colors.primary[400]} borderRadius="8px" p="32px" mb="20px" textAlign="center">
      <Box mb="20px">
        <h2 style={{ color: colors.grey[100], fontSize: '24px', fontWeight: '600', marginBottom: '12px' }}>
          Complete Your Profile
        </h2>
        <p style={{ color: colors.grey[300], fontSize: '16px', lineHeight: '1.6' }}>
          You haven't linked your researcher profile yet. You can search for an existing profile to claim,
          or create a new one with your information.
        </p>
      </Box>
      
      <Box display="flex" gap="16px" justifyContent="center" flexWrap="wrap">
        <Button
          variant="contained"
          startIcon={<Search size={18} />}
          sx={{
            backgroundColor: colors.blueAccent[700],
            color: colors.grey[100],
            padding: '12px 24px',
            fontSize: '16px',
            '&:hover': { backgroundColor: colors.blueAccent[800] },
          }}
          onClick={() => navigate('/claim-profile')}
        >
          Search & Claim Profile
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<UserIcon size={18} />}
          sx={{
            borderColor: colors.greenAccent[700],
            color: colors.greenAccent[700],
            padding: '12px 24px',
            fontSize: '16px',
            '&:hover': { 
              borderColor: colors.greenAccent[600],
              backgroundColor: colors.greenAccent[700] + '20',
            },
          }}
          onClick={() => navigate('/create-profile')}
        >
          Create New Profile
        </Button>
      </Box>
    </Box>
  );

  const UserInfo = () => (
    <Box backgroundColor={colors.primary[400]} borderRadius="8px" p="32px" mb="20px">
      {/* Header Section */}
      <Box mb="24px">
        <h2 style={{ 
          color: colors.grey[100], 
          fontSize: '32px', 
          fontWeight: '600', 
          marginBottom: '8px',
          letterSpacing: '-0.5px'
        }}>
          {user.person_name || user.email}
        </h2>
        
        {user.bio && (
          <p style={{ 
            color: colors.grey[200], 
            fontSize: '16px',
            fontStyle: 'italic',
            lineHeight: '1.6',
            marginTop: '12px',
            opacity: 0.9
          }}>
            {user.bio}
          </p>
        )}
      </Box>

      {/* Contact Info Section */}
      <Box display="flex" flexDirection="column" gap="12px" mb="24px" pb="24px" borderBottom={`1px solid ${colors.primary[300]}`}>
        <Box display="flex" alignItems="center" gap="12px">
          <Mail size={18} color={colors.greenAccent[500]} />
          <span style={{ color: colors.grey[100], fontSize: '15px' }}>{user.email}</span>
        </Box>

        {user.person_phone && (
          <Box display="flex" alignItems="center" gap="12px">
            <Phone size={18} color={colors.greenAccent[500]} />
            <span style={{ color: colors.grey[100], fontSize: '15px' }}>{user.person_phone}</span>
          </Box>
        )}
      </Box>

      {/* Expertise Section */}
      {(user.expertise_1 || user.expertise_2 || user.expertise_3) && (
        <Box mb="24px" pb="24px" borderBottom={`1px solid ${colors.primary[300]}`}>
          <h4 style={{ 
            color: colors.grey[100], 
            fontSize: '14px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '12px',
            opacity: 0.7
          }}>
            Expertise Areas
          </h4>
          <Box display="flex" flexWrap="wrap" gap="8px">
            {user.expertise_1 && (
              <Chip 
                label={user.expertise_1} 
                size="medium"
                sx={{ 
                  backgroundColor: colors.blueAccent[700], 
                  color: colors.grey[100],
                  fontSize: '14px',
                  fontWeight: '500'
                }} 
              />
            )}
            {user.expertise_2 && (
              <Chip 
                label={user.expertise_2} 
                size="medium"
                sx={{ 
                  backgroundColor: colors.blueAccent[700], 
                  color: colors.grey[100],
                  fontSize: '14px',
                  fontWeight: '500'
                }} 
              />
            )}
            {user.expertise_3 && (
              <Chip 
                label={user.expertise_3} 
                size="medium"
                sx={{ 
                  backgroundColor: colors.blueAccent[700], 
                  color: colors.grey[100],
                  fontSize: '14px',
                  fontWeight: '500'
                }} 
              />
            )}
          </Box>
        </Box>
      )}

      {/* Affiliation Section */}
      {(user.department_name || user.institution_name) && (
        <Box mb="24px" pb="24px" borderBottom={`1px solid ${colors.primary[300]}`}>
          <h4 style={{ 
            color: colors.grey[100], 
            fontSize: '14px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '12px',
            opacity: 0.7
          }}>
            Affiliation
          </h4>
          <Box display="flex" flexDirection="column" gap="8px">
            {user.institution_name && (
              <Box display="flex" flexDirection="column">
                <span 
                  onClick={() => user.institution_id && navigate(`/institution/${user.institution_id}`)}
                  style={{ 
                    color: colors.grey[100], 
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: user.institution_id ? 'pointer' : 'default',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => user.institution_id && (e.target.style.color = colors.blueAccent[400])}
                  onMouseLeave={(e) => (e.target.style.color = colors.grey[100])}
                >
                  {user.institution_name}
                </span>
                {user.department_name && (
                  <span 
                    onClick={() => user.department_id && navigate(`/department/${user.department_id}`)}
                    style={{ 
                      color: colors.grey[200], 
                      fontSize: '14px',
                      marginTop: '4px',
                      cursor: user.department_id ? 'pointer' : 'default',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => user.department_id && (e.target.style.color = colors.blueAccent[400])}
                    onMouseLeave={(e) => (e.target.style.color = colors.grey[200])}
                  >
                    {user.department_name}
                  </span>
                )}
              </Box>
            )}
          </Box>
        </Box>
      )}

      {/* Meta Info Section */}
      <Box display="flex" flexDirection="column" gap="8px">
        <Box display="flex" alignItems="center" gap="10px">
          <Calendar size={16} color={colors.grey[300]} />
          <span style={{ color: colors.grey[300], fontSize: '13px' }}>
            Joined {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </Box>

        {user.last_login && (
          <Box display="flex" alignItems="center" gap="10px">
            <UserIcon size={16} color={colors.grey[300]} />
            <span style={{ color: colors.grey[300], fontSize: '13px' }}>
              Last active {new Date(user.last_login).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </Box>
        )}
      </Box>
    </Box>
  );

  const ProjectCard = ({ project }) => (
    <Box
      backgroundColor={colors.primary[400]}
      borderRadius="8px"
      border={`1px solid ${colors.primary[300]}`}
      p="20px"
      sx={{
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.palette.mode === 'dark' ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.1)'
        }
      }}
      onClick={() => navigate(`/project/${project.project_id}`)}
    >
      <Box display="flex" justifyContent="space-between" alignItems="start" mb="12px">
        <h3 style={{ color: colors.grey[100], fontSize: '18px', fontWeight: '600', flex: 1 }}>
          {project.project_title}
        </h3>
        {project.award_amount && (
          <Box display="flex" alignItems="center" gap="4px">
            <Award size={16} color={colors.greenAccent[500]} />
            <span style={{ color: colors.greenAccent[500], fontWeight: '600' }}>
              ${project.award_amount.toLocaleString()}
            </span>
          </Box>
        )}
      </Box>

      {project.project_description && (
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
          {project.project_description}
        </p>
      )}

      <Box display="flex" flexWrap="wrap" gap="8px" mb="12px">
        <Chip 
          label={project.project_role} 
          size="small"
          sx={{ backgroundColor: colors.blueAccent[700], color: colors.grey[100] }} 
        />
        {project.funding_mechanism && (
          <Chip 
            label={project.funding_mechanism} 
            size="small"
            sx={{ backgroundColor: colors.primary[300], color: colors.grey[100] }} 
          />
        )}
      </Box>

      <Box display="flex" gap="12px" fontSize="12px" color={colors.grey[400]}>
        {project.start_date && <span>Start: {new Date(project.start_date).toLocaleDateString()}</span>}
        {project.end_date && <span>End: {new Date(project.end_date).toLocaleDateString()}</span>}
      </Box>
    </Box>
  );

  return (
    <Box m="20px">
      <Header title="Profile" subtitle={user.person_name || 'Researcher Profile'} />
      
      {!user.person_id ? (
        <NoProfileSection />
      ) : (
        <>
          <UserInfo />
          <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
            <Header title="My Projects" subtitle={`${projects.length} project${projects.length !== 1 ? 's' : ''}`} />
            <Button
              variant="contained"
              startIcon={<Plus size={18} />}
              onClick={() => setShowAddProjectModal(true)}
              sx={{
                backgroundColor: colors.greenAccent[600],
                color: colors.grey[100],
                padding: '10px 20px',
                '&:hover': { backgroundColor: colors.greenAccent[700] }
              }}
            >
              Add Project
            </Button>
          </Box>
          
          {projects.length > 0 ? (
            <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(350px, 1fr))" gap="20px">
              {projects.map((project) => <ProjectCard key={project.project_id} project={project} />)}
            </Box>
          ) : (
            <Box 
              backgroundColor={colors.primary[400]} 
              borderRadius="8px" 
              p="40px" 
              textAlign="center"
            >
              <p style={{ color: colors.grey[300], fontSize: '16px' }}>
                No projects yet. Start collaborating!
              </p>
            </Box>
          )}
        </>
      )}
      
      <AddProjectModal
        open={showAddProjectModal}
        onClose={() => setShowAddProjectModal(false)}
        userId={parseInt(id)}
        onProjectAdded={handleProjectAdded}
      />
    </Box>
  );
};

export default User;

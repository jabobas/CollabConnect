/*
Filename: index.jsx
Author: Lucas Matheson
Edited by: Lucas Matheson
Date: November 20, 2025

The goal of this page is to allow a user to search for researchers based on 
a name, expertise, or institution. 

*/

import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Chip, Grid, Avatar, Divider, CircularProgress, Paper, Stack, IconButton, Collapse } from "@mui/material";
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { styled } from '@mui/material/styles';

import { tokens } from "../../theme";
import Header from "../../components/Header";
import { useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useParams } from 'react-router-dom';
import {
  GraduationCap,
  School,
  Hospital,
  FlaskConical,
  HeartHandshake,
  Building,
  Stethoscope,
} from "lucide-react";

// todo: there maybe a better way of mapping icons
export const institutionIconMap = {
  "University": GraduationCap,
  "Academic": GraduationCap,
  "Domestic Higher Education": GraduationCap,
  "UNIVERSITY-WIDE": GraduationCap,
  "SCHOOLS OF OSTEOPATHIC MEDICINE": Stethoscope,
  "Hospital": Hospital,
  "Independent Hospitals": Hospital,
  "Research Institute": FlaskConical,
  "Research Institutes": FlaskConical,
  "Non-Profit Organization": HeartHandshake,
  "Other Domestic Non-Profits": HeartHandshake,
  "Domestic For-Profits": Building,
  "Default": School,
};

const ExpandMore = styled((props) => {
  const { expand, ...other } = props;
  return <IconButton {...other} />;
})(({ theme, expand }) => ({
  transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
  marginLeft: 'auto',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

const ResearcherCard = ({ person, colors }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card 
      sx={{ 
        width: '100%',
        height: '400px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: colors.primary[400],
        transition: 'all 0.3s ease',
        border: `1px solid ${colors.primary[300]}`,
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 24px ${colors.greenAccent[700]}30`,
          borderColor: colors.greenAccent[600]
        }
      }}
    >
      <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2} flexShrink={0}>
          <Box display="flex" alignItems="center" gap={2} flex={1}>
            <Avatar 
              sx={{ 
                bgcolor: colors.greenAccent[600],
                width: 56,
                height: 56,
                fontSize: '1.5rem',
                fontWeight: 600
              }}
            >
              {person.person_name?.charAt(0) || '?'}
            </Avatar>
            <Box flex={1}>
              <Typography variant="h5" fontWeight="600" color={colors.grey[100]} mb={0.5}>
                {person.person_name}
              </Typography>
              {person.main_field && (
                <Chip 
                  label={person.main_field}
                  size="small"
                  sx={{ 
                    backgroundColor: colors.blueAccent[700],
                    color: colors.grey[100],
                    fontWeight: 500
                  }}
                />
              )}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2, borderColor: colors.primary[300] }} />

        <Box sx={{ overflowY: 'auto', flex: 1, pr: 1 }}>
          {[person.expertise_1, person.expertise_2, person.expertise_3].filter(Boolean).length > 0 && (
            <Box mb={2}>
              <Typography 
                variant="overline" 
                color={colors.grey[300]} 
                display="block" 
                mb={1}
                fontWeight={600}
              >
                Expertise
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {[person.expertise_1, person.expertise_2, person.expertise_3]
                  .filter(Boolean)
                  .map((expertise, idx) => (
                    <Chip 
                      key={idx}
                      label={expertise}
                      size="small"
                      sx={{ 
                        backgroundColor: colors.greenAccent[800],
                        color: colors.grey[100],
                        mb: 0.5
                      }}
                    />
                  ))}
              </Stack>
            </Box>
          )}

          <Stack spacing={1.5} mb={2}>
            {person.person_email && (
              <Box display="flex" alignItems="center" gap={1.5}>
                <EmailIcon sx={{ fontSize: 20, color: colors.greenAccent[500], flexShrink: 0 }} />
                <Typography 
                  variant="body2" 
                  color={colors.grey[200]} 
                  sx={{ 
                    wordBreak: 'break-word',
                    fontSize: '0.9rem'
                  }}
                >
                  {person.person_email}
                </Typography>
              </Box>
            )}
            
            {person.person_phone && (
              <Box display="flex" alignItems="center" gap={1.5}>
                <PhoneIcon sx={{ fontSize: 20, color: colors.greenAccent[500], flexShrink: 0 }} />
                <Typography variant="body2" color={colors.grey[200]} sx={{ fontSize: '0.9rem' }}>
                  {person.person_phone}
                </Typography>
              </Box>
            )}
          </Stack>

          {person.bio && (
            <>
              <Box display="flex" alignItems="center">
                <Typography 
                  variant="body2" 
                  color={colors.greenAccent[400]}
                  sx={{ cursor: 'pointer', fontWeight: 500 }}
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? 'Hide Bio' : 'Show Bio'}
                </Typography>
                <ExpandMore
                  expand={expanded}
                  onClick={() => setExpanded(!expanded)}
                  aria-expanded={expanded}
                  sx={{ color: colors.greenAccent[400] }}
                >
                  <ExpandMoreIcon />
                </ExpandMore>
              </Box>
              <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Paper 
                  sx={{ 
                    mt: 2, 
                    p: 2, 
                    backgroundColor: colors.primary[500],
                    border: `1px solid ${colors.primary[300]}`,
                    maxHeight: '150px',
                    overflowY: 'auto'
                  }}
                >
                  <Typography 
                    variant="body2" 
                    color={colors.grey[200]} 
                    sx={{ lineHeight: 1.7 }}
                  >
                    {person.bio}
                  </Typography>
                </Paper>
              </Collapse>
            </>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

const DepartmentCard = ({ departmentName, people, colors, isExpanded, onToggle }) => {
  const Icon = institutionIconMap['University'] || institutionIconMap["Default"];

  return (
    <Card 
      onClick={onToggle}
      sx={{ 
        width: '100%',
        height: '400px',
        backgroundColor: colors.primary[400],
        border: `2px solid ${isExpanded ? colors.greenAccent[500] : colors.primary[300]}`,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 24px ${colors.greenAccent[700]}40`,
          borderColor: colors.greenAccent[500]
        }
      }}
    >
      <CardContent 
        sx={{ 
          p: 3, 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}
      >
        <Box 
          sx={{ 
            p: 3, 
            borderRadius: '50%', 
            backgroundColor: colors.greenAccent[700],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3
          }}
        >
          <Icon style={{ width: 48, height: 48, color: colors.grey[100] }} />
        </Box>
        
        <Typography variant="h4" fontWeight="600" color={colors.grey[100]} mb={2}>
          {departmentName}
        </Typography>
        
        <Chip 
          label={`${Object.keys(people).length} ${Object.keys(people).length === 1 ? 'Researcher' : 'Researchers'}`}
          sx={{ 
            backgroundColor: colors.blueAccent[700],
            color: colors.grey[100],
            fontWeight: 600,
            fontSize: '0.9rem',
            px: 2,
            py: 2.5
          }}
        />
        
        <Box 
          sx={{ 
            mt: 4,
            display: 'flex',
            alignItems: 'center',
            color: colors.greenAccent[400]
          }}
        >
          <Typography variant="body1" fontWeight={500}>
            {isExpanded ? 'Click to collapse' : 'Click to expand'}
          </Typography>
          <ChevronRightIcon 
            sx={{ 
              ml: 1,
              transition: 'transform 0.3s',
              transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
            }} 
          />
        </Box>
      </CardContent>
    </Card>
  );
};

const Institution = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { id } = useParams(); 
  const [institutionData, setInstitution] = useState();
  const [loading, setLoading] = useState(true);
  const [expandedDepartment, setExpandedDepartment] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`http://127.0.0.1:5000/institution/one/${id}`)
      .then((response) => {
        setInstitution(response.data.data);
        console.log(response.data.data);
      })
      .catch((err) => {
        console.log(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleDepartmentToggle = (deptName) => {
    setExpandedDepartment(expandedDepartment === deptName ? null : deptName);
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="80vh"
        backgroundColor={colors.primary[500]}
      >
        <CircularProgress size={60} sx={{ color: colors.greenAccent[500] }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: colors.primary[500],
        minHeight: "100vh",
        pb: 4
      }}
    >
      <Box m="20px 20px 0px 20px">
        <Header
          title="Institution"
          subtitle={institutionData?.institution_name ?? 'Loading...'}
        />
      </Box>

      <Box m="20px">
        {institutionData && Object.keys(institutionData).length > 0 ? (
          <Grid container spacing={3}>
            {Object.entries(institutionData).map(([departmentName, people]) => (
              <React.Fragment key={departmentName}>
                <Grid item xs={12} sm={6} lg={4}>
                  <DepartmentCard 
                    departmentName={departmentName}
                    people={people}
                    colors={colors}
                    isExpanded={expandedDepartment === departmentName}
                    onToggle={() => handleDepartmentToggle(departmentName)}
                  />
                </Grid>
                
                {expandedDepartment === departmentName && (
                  <Grid item xs={12} sx={{ 
                    animation: 'slideDown 0.4s ease-out',
                    '@keyframes slideDown': {
                      from: {
                        opacity: 0,
                        transform: 'translateY(-20px)',
                        maxHeight: 0
                      },
                      to: {
                        opacity: 1,
                        transform: 'translateY(0)',
                        maxHeight: '2000px'
                      }
                    }
                  }}>
                    <Box sx={{ 
                      p: 3, 
                      backgroundColor: colors.primary[400],
                      borderRadius: '8px',
                      border: `1px solid ${colors.greenAccent[500]}`
                    }}>
                      <Typography variant="h5" fontWeight="600" color={colors.grey[100]} mb={3}>
                        Researchers in {departmentName}
                      </Typography>
                      <Grid container spacing={3}>
                        {Object.entries(people).map(([personName, person]) => (
                          <Grid item xs={12} sm={6} lg={4} key={person.person_id}>
                            <ResearcherCard person={person} colors={colors} />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Grid>
                )}
              </React.Fragment>
            ))}
          </Grid>
        ) : (
          <Paper 
            sx={{ 
              p: 6, 
              textAlign: 'center',
              backgroundColor: colors.primary[400]
            }}
          >
            <Typography variant="h5" color={colors.grey[300]}>
              No data available for this institution
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default Institution;
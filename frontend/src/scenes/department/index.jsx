/*
 * Author: Aubin Mugisha & Copilot
 * Description: department details page displaying department info and member cards with expertise areas.
 */

import React, { useState, useEffect, memo, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Divider,
  CircularProgress,
  Paper,
  Stack,
  useTheme 
} from "@mui/material";
import { 
  Users, 
  GraduationCap
} from "lucide-react";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BusinessIcon from "@mui/icons-material/Business";
import SchoolIcon from "@mui/icons-material/School";
import axios from "axios";
import Header from "../../components/Header";
import { tokens } from "../../theme";

const Department = () => {
  const { id } = useParams();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  
  const [department, setDepartment] = useState(null);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [deptRes, peopleRes] = await Promise.all([
          axios.get(`/department/${id}`),
          axios.get(`/department/${id}/people`)
        ]);
        
        if (deptRes.data.status === 'success') setDepartment(deptRes.data.data);
        if (peopleRes.data.status === 'success') setPeople(peopleRes.data.data);
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <Box m="20px" display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress sx={{ color: colors.greenAccent[500] }} size={60} />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box m="20px">
        <Header title="Error" subtitle={`Failed to load department: ${error}`} />
      </Box>
    );
  }
  
  if (!department) {
    return (
      <Box m="20px">
        <Header title="Not Found" subtitle="Department not found" />
      </Box>
    );
  }

  const DepartmentInfoCard = () => (
    <Paper
      elevation={3}
      sx={{
        backgroundColor: colors.primary[400],
        borderRadius: '16px',
        p: 4,
        mb: 4,
        border: `1px solid ${colors.primary[300]}`,
        boxShadow: `0 8px 32px ${colors.primary[900]}40`
      }}
    >
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Avatar
          sx={{
            bgcolor: colors.blueAccent[600],
            width: 64,
            height: 64,
            fontSize: '1.8rem',
            fontWeight: 700,
            boxShadow: `0 4px 12px ${colors.blueAccent[700]}50`
          }}
        >
          <SchoolIcon sx={{ fontSize: 36 }} />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight="700" color={colors.grey[100]}>
            {department.department_name}
          </Typography>
          <Typography variant="subtitle1" color={colors.grey[300]} fontWeight="500">
            Department Information
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 3, borderColor: colors.primary[300] }} />

      <Stack spacing={2.5}>
        {department.institution_name && (
          <Box
            display="flex"
            alignItems="center"
            gap={2}
            sx={{
              cursor: 'pointer',
              padding: '12px 16px',
              marginLeft: '-16px',
              borderRadius: '12px',
              transition: 'all 0.3s',
              '&:hover': {
                backgroundColor: colors.primary[500],
                transform: 'translateX(8px)'
              }
            }}
            onClick={() => navigate(`/institution/${department.institution_id}`)}
          >
            <BusinessIcon sx={{ fontSize: 24, color: colors.greenAccent[400] }} />
            <Box>
              <Typography variant="caption" color={colors.grey[400]} fontSize="11px" fontWeight="600">
                INSTITUTION
              </Typography>
              <Typography variant="body1" color={colors.grey[100]} fontWeight="600">
                {department.institution_name}
              </Typography>
            </Box>
          </Box>
        )}

        {department.department_email && (
          <Box display="flex" alignItems="center" gap={2} px={2}>
            <EmailIcon sx={{ fontSize: 24, color: colors.greenAccent[400] }} />
            <Box>
              <Typography variant="caption" color={colors.grey[400]} fontSize="11px" fontWeight="600">
                EMAIL
              </Typography>
              <Typography
                variant="body1"
                component="a"
                href={`mailto:${department.department_email}`}
                sx={{
                  color: colors.grey[100],
                  textDecoration: 'none',
                  fontWeight: 500,
                  '&:hover': { color: colors.greenAccent[400] }
                }}
              >
                {department.department_email}
              </Typography>
            </Box>
          </Box>
        )}

        {department.department_phone && (
          <Box display="flex" alignItems="center" gap={2} px={2}>
            <PhoneIcon sx={{ fontSize: 24, color: colors.greenAccent[400] }} />
            <Box>
              <Typography variant="caption" color={colors.grey[400]} fontSize="11px" fontWeight="600">
                PHONE
              </Typography>
              <Typography variant="body1" color={colors.grey[100]} fontWeight="500">
                {department.department_phone}
              </Typography>
            </Box>
          </Box>
        )}

        <Box
          display="flex"
          alignItems="center"
          gap={2}
          px={2}
          py={1.5}
          sx={{
            backgroundColor: colors.blueAccent[900],
            borderRadius: '12px',
            border: `2px solid ${colors.blueAccent[700]}`
          }}
        >
          <Users size={24} color={colors.blueAccent[400]} />
          <Box>
            <Typography variant="caption" color={colors.blueAccent[300]} fontSize="11px" fontWeight="600">
              TOTAL MEMBERS
            </Typography>
            <Typography variant="h5" color={colors.grey[100]} fontWeight="700">
              {people.length} {people.length === 1 ? 'Researcher' : 'Researchers'}
            </Typography>
          </Box>
        </Box>
      </Stack>
    </Paper>
  );

  const PersonCard = memo(({ person }) => {
    const expertiseList = useMemo(
      () => person.expertises?.filter(Boolean) || [],
      [person.expertises]
    );

    return (
      <Card
        sx={{
          backgroundColor: colors.primary[400],
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s',
          borderRadius: '12px',
          border: `1px solid ${colors.primary[300]}`,
          '&:hover': {
            transform: 'translateY(-8px)',
            boxShadow: `0 12px 32px -10px ${colors.greenAccent[700]}80`,
            borderColor: colors.greenAccent[500],
            cursor: 'pointer'
          }
        }}
        onClick={() => navigate(`/person/${person.person_id}`)}
      >
        <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box display="flex" alignItems="flex-start" gap={2} mb={2.5}>
            <Avatar
              sx={{
                bgcolor: colors.greenAccent[600],
                width: 56,
                height: 56,
                fontSize: '1.5rem',
                fontWeight: 700,
                boxShadow: `0 4px 12px ${colors.greenAccent[700]}50`
              }}
            >
              {person.person_name?.charAt(0) || '?'}
            </Avatar>

            <Box flex={1} minWidth={0}>
              <Typography
                variant="h6"
                fontWeight="700"
                color={colors.grey[100]}
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  mb: 0.5
                }}
              >
                {person.person_name}
              </Typography>

              {person.main_field && person.main_field !== 'main_field' && (
                <Chip
                  label={person.main_field}
                  size="small"
                  sx={{
                    height: 24,
                    backgroundColor: colors.blueAccent[700],
                    color: colors.grey[100],
                    fontWeight: 600,
                    fontSize: '0.75rem'
                  }}
                />
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2, borderColor: colors.primary[300] }} />

          {expertiseList.length > 0 ? (
            <Box mb={2}>
              <Typography
                variant="caption"
                color={colors.grey[400]}
                fontWeight={700}
                display="block"
                fontSize="11px"
                mb={1}
                letterSpacing="0.5px"
              >
                EXPERTISE AREAS
              </Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {expertiseList.map((expertise, idx) => (
                  <Chip
                    key={idx}
                    label={expertise}
                    size="small"
                    sx={{
                      height: 26,
                      backgroundColor: colors.greenAccent[800],
                      color: colors.grey[100],
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      mb: 0.5,
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: colors.greenAccent[700]
                      }
                    }}
                  />
                ))}
              </Stack>
            </Box>
          ) : (
            <Box
              flex={1}
              display="flex"
              alignItems="center"
              justifyContent="center"
              py={2}
            >
              <Typography
                variant="caption"
                color={colors.grey[500]}
                fontStyle="italic"
                fontSize="12px"
              >
                No expertise areas listed
              </Typography>
            </Box>
          )}

          <Stack spacing={1} mt="auto">
            {person.person_email && (
              <Box display="flex" alignItems="center" gap={1}>
                <EmailIcon sx={{ fontSize: 16, color: colors.greenAccent[400] }} />
                <Typography
                  variant="caption"
                  color={colors.grey[200]}
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: 500
                  }}
                  fontSize={11}
                >
                  {person.person_email}
                </Typography>
              </Box>
            )}
            {person.person_phone && (
              <Box display="flex" alignItems="center" gap={1}>
                <PhoneIcon sx={{ fontSize: 16, color: colors.greenAccent[400] }} />
                <Typography variant="caption" fontSize={11} color={colors.grey[200]} fontWeight={500}>
                  {person.person_phone}
                </Typography>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  });

  PersonCard.displayName = 'PersonCard';

  return (
    <Box m="20px">
      <Header 
        title={department.department_name} 
        subtitle={`${people.length} ${people.length === 1 ? 'researcher' : 'researchers'} in this department`}
      />
      
      <DepartmentInfoCard />

      {people.length > 0 && (
        <>
          <Box mb={3}>
            <Typography variant="h5" fontWeight="700" color={colors.grey[100]} mb={1}>
              Department Researchers
            </Typography>
            <Typography variant="body2" color={colors.grey[400]}>
              Browse and connect with {people.length} talented {people.length === 1 ? 'researcher' : 'researchers'}
            </Typography>
          </Box>

          <Box
            display="grid"
            gridTemplateColumns="repeat(auto-fill, minmax(320px, 1fr))"
            gap={3}
          >
            {people.map((person) => (
              <PersonCard key={person.person_id} person={person} />
            ))}
          </Box>
        </>
      )}

      {people.length === 0 && (
        <Paper
          sx={{
            backgroundColor: colors.primary[400],
            borderRadius: '12px',
            p: 6,
            textAlign: 'center',
            border: `1px solid ${colors.primary[300]}`
          }}
        >
          <GraduationCap
            size={64}
            color={colors.grey[500]}
            style={{ marginBottom: '16px' }}
          />
          <Typography variant="h6" color={colors.grey[300]} mb={1}>
            No researchers found
          </Typography>
          <Typography variant="body2" color={colors.grey[500]}>
            This department currently has no registered members.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default Department;

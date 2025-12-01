/*
Author: Aubin Mugisha
Date: November 28, 2025

The goal of this page is to display information about a specific department
and list all its members with their research areas.

*/

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, useTheme, CircularProgress } from "@mui/material";
import { Mail, MapPin, Users, Phone } from "lucide-react";
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

  if (loading) return <Box m="20px" display="flex" justifyContent="center" alignItems="center" height="80vh"><CircularProgress /></Box>;
  if (error) return <Box m="20px"><Header title="Error" subtitle={`Failed to load department: ${error}`} /></Box>;
  if (!department) return <Box m="20px"><Header title="Not Found" subtitle="Department not found" /></Box>;

  const DepartmentInfo = () => (
    <Box backgroundColor={colors.primary[400]} borderRadius="8px" p="24px" mb="20px">
      <Box display="flex" flexDirection="column" gap="12px">
        {department.institution_name && (
          <Box 
            display="flex" 
            alignItems="center" 
            gap="12px"
            sx={{
              cursor: 'pointer',
              padding: '4px 8px',
              marginLeft: '-8px',
              borderRadius: '4px',
              transition: 'background-color 0.2s',
              '&:hover': { backgroundColor: colors.primary[300] }
            }}
            onClick={() => navigate(`/institution/${department.institution_id}`)}
          >
            <MapPin size={20} color={colors.greenAccent[500]} />
            <span style={{ color: colors.grey[100] }}>{department.institution_name}</span>
          </Box>
        )}

        {department.department_email && (
          <Box display="flex" alignItems="center" gap="12px">
            <Mail size={20} color={colors.greenAccent[500]} />
            <a href={`mailto:${department.department_email}`} style={{ color: colors.grey[100], textDecoration: 'none' }}>
              {department.department_email}
            </a>
          </Box>
        )}
        
        {department.department_phone && (
          <Box display="flex" alignItems="center" gap="12px">
            <Phone size={20} color={colors.greenAccent[500]} />
            <span style={{ color: colors.grey[100] }}>{department.department_phone}</span>
          </Box>
        )}

        <Box display="flex" alignItems="center" gap="12px">
          <Users size={20} color={colors.greenAccent[500]} />
          <span style={{ color: colors.grey[100] }}>
            {people.length} {people.length === 1 ? 'Member' : 'Members'}
          </span>
        </Box>
      </Box>
    </Box>
  );

  const PersonCard = ({ person }) => (
    <Box
      key={person.person_id}
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
      onClick={() => navigate(`/person/${person.person_id}`)}
    >
      <h3 style={{ color: colors.grey[100], fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
        {person.person_name}
      </h3>

      <Box display="flex" flexWrap="wrap" gap="8px" mt="12px">
        {person.expertises && person.expertises.length > 0 ? (
          person.expertises.filter(Boolean).map((expertise, idx) => (
            <span
              key={`${expertise}-${idx}`}
              style={{
                padding: '4px 12px',
                backgroundColor: colors.blueAccent[700],
                color: colors.grey[100],
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500'
              }}
            >
              {expertise}
            </span>
          ))
        ) : (
          <span style={{ color: colors.grey[400], fontSize: '12px', fontStyle: 'italic' }}>
            No research areas listed
          </span>
        )}
      </Box>
    </Box>
  );

  return (
    <Box m="20px">
      <Header title={department.department_name} subtitle="Department Information" />
      <DepartmentInfo />
      <Header title="Department Members" subtitle={`${people.length} people`} />

      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap="20px">
        {people.map((person) => <PersonCard key={person.person_id} person={person} />)}
      </Box>
    </Box>
  );
};

export default Department;

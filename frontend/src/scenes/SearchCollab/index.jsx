import React, { useState } from 'react';
import { Box } from "@mui/material";
import { Search, Users, BookOpen, Award, MapPin, Mail, ExternalLink } from 'lucide-react';
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { useTheme } from "@mui/material";

const SearchCollab = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState('all');
  const [selectedInstitution, setSelectedInstitution] = useState('all');

  const researchers = [
    {
      id: 1,
      name: 'Dr. Sarah Chen',
      title: 'Professor of Machine Learning',
      institution: 'MIT',
      location: 'Cambridge, MA',
      expertises: ['Machine Learning', 'Neural Networks', 'Computer Vision'],
      publications: 147,
      hIndex: 42,
      email: 's.chen@mit.edu'
    },
    {
      id: 2,
      name: 'Dr. James Rodriguez',
      title: 'Associate Professor of Quantum Physics',
      institution: 'Stanford University',
      location: 'Stanford, CA',
      expertises: ['Quantum Computing', 'Theoretical Physics', 'Quantum Cryptography'],
      publications: 89,
      hIndex: 31,
      email: 'j.rodriguez@stanford.edu'
    },
    {
      id: 3,
      name: 'Dr. Amelia Thompson',
      title: 'Senior Researcher in Biotechnology',
      institution: 'Harvard Medical School',
      location: 'Boston, MA',
      expertises: ['CRISPR', 'Gene Therapy', 'Molecular Biology'],
      publications: 203,
      hIndex: 56,
      email: 'a.thompson@harvard.edu'
    },
    {
      id: 4,
      name: 'Dr. Marcus Liu',
      title: 'Assistant Professor of Climate Science',
      institution: 'UC Berkeley',
      location: 'Berkeley, CA',
      expertises: ['Climate Modeling', 'Atmospheric Science', 'Environmental Data'],
      publications: 52,
      hIndex: 18,
      email: 'm.liu@berkeley.edu'
    },
    {
      id: 5,
      name: 'Dr. Emily Foster',
      title: 'Research Director in Neuroscience',
      institution: 'Johns Hopkins University',
      location: 'Baltimore, MD',
      expertises: ['Cognitive Neuroscience', 'Brain Imaging', 'Neural Plasticity'],
      publications: 178,
      hIndex: 48,
      email: 'e.foster@jhu.edu'
    },
    {
      id: 6,
      name: 'Dr. Raj Patel',
      title: 'Professor of Renewable Energy',
      institution: 'MIT',
      location: 'Cambridge, MA',
      expertises: ['Solar Energy', 'Battery Technology', 'Sustainable Systems'],
      publications: 134,
      hIndex: 39,
      email: 'r.patel@mit.edu'
    }
  ];

  const allExpertises = [...new Set(researchers.flatMap(r => r.expertises))].sort();
  const allInstitutions = [...new Set(researchers.map(r => r.institution))].sort();

  const filteredResearchers = researchers.filter(researcher => {
    const matchesSearch =
      searchTerm === '' ||
      researcher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      researcher.expertises.some(exp => exp.toLowerCase().includes(searchTerm.toLowerCase())) ||
      researcher.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesExpertise =
      selectedExpertise === 'all' || researcher.expertises.includes(selectedExpertise);

    const matchesInstitution =
      selectedInstitution === 'all' || researcher.institution === selectedInstitution;

    return matchesSearch && matchesExpertise && matchesInstitution;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: colors.primary[500] }}>
      
      <Box m="20px 20px 0px 20px">
        <Header title="Search Collaborators" subtitle="Search for Potential Collaborators" />
      </Box>

      <div style={{ flex: 1, padding: '24px 24px 0px 24px', overflowY: 'auto' }}>

        <div style={{
          backgroundColor: colors.primary[400],
          borderRadius: '12px',
          border: `1px solid ${colors.primary[300]}`,
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>

            <div style={{ position: 'relative' }}>
              <Search
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: colors.grey[300],
                  width: '20px',
                  height: '20px'
                }}
              />
              <input
                type="text"
                placeholder="Search by name, expertise, or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 44px',
                  backgroundColor: theme.palette.mode === "dark" ? colors.primary[600] : colors.grey[900],
                  color: colors.grey[100],
                  border: `1px solid ${colors.primary[300]}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: colors.grey[300],
                  marginBottom: '8px'
                }}>
                  Expertise Area
                </label>
                <select
                  value={selectedExpertise}
                  onChange={(e) => setSelectedExpertise(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: theme.palette.mode === "dark" ? colors.primary[600] : colors.grey[900],
                    color: colors.grey[100],
                    border: `1px solid ${colors.primary[300]}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="all">All Expertises</option>
                  {allExpertises.map(exp => (
                    <option key={exp} value={exp}>{exp}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: colors.grey[300],
                  marginBottom: '8px'
                }}>
                  Institution
                </label>
                <select
                  value={selectedInstitution}
                  onChange={(e) => setSelectedInstitution(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: theme.palette.mode === "dark" ? colors.primary[600] : colors.grey[900],
                    color: colors.grey[100],
                    border: `1px solid ${colors.primary[300]}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                >
                  <option value="all">All Institutions</option>
                  {allInstitutions.map(inst => (
                    <option key={inst} value={inst}>{inst}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedExpertise('all');
                    setSelectedInstitution('all');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    backgroundColor: colors.greenAccent[700],
                    color: colors.greenAccent[100],
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Clear Filters
                </button>
              </div>

            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: colors.grey[300], fontSize: '14px' }}>
          <Users style={{ width: '16px', height: '16px' }} />
          <span>{filteredResearchers.length} researchers found</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '24px',
          maxHeight: '53.1vh',
          overflowY: 'auto',
          paddingTop: '5px'
        }}>
          {filteredResearchers.map(researcher => (
            <div
              key={researcher.id}
              style={{
                backgroundColor: colors.primary[400],
                borderRadius: '12px',
                border: `1px solid ${colors.primary[300]}`,
                padding: '24px',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow =
                  theme.palette.mode === "dark"
                    ? '0 8px 24px rgba(0,0,0,0.4)'
                    : '0 8px 24px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ color: colors.grey[100], fontSize: '18px', fontWeight: '600', margin: '0 0 4px 0' }}>
                  {researcher.name}
                </h3>
                <p style={{ color: colors.grey[300], fontSize: '14px', margin: 0 }}>
                  {researcher.title}
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <MapPin style={{ width: '16px', height: '16px', color: colors.grey[300] }} />
                  <span style={{ color: colors.grey[300], fontSize: '13px' }}>{researcher.institution}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin style={{ width: '16px', height: '16px', color: colors.grey[300] }} />
                  <span style={{ color: colors.grey[300], fontSize: '13px' }}>{researcher.location}</span>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <p style={{
                  color: colors.grey[300],
                  fontSize: '11px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  textTransform: 'uppercase'
                }}>
                  Research Areas
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {researcher.expertises.map((exp, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '4px 12px',
                        backgroundColor: colors.blueAccent[800],
                        color: colors.blueAccent[200],
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      {exp}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '16px',
                paddingTop: '16px',
                borderTop: `1px solid ${colors.primary[300]}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BookOpen style={{ width: '16px', height: '16px', color: colors.grey[300] }} />
                  <span style={{ color: colors.grey[300], fontSize: '13px' }}>{researcher.publications} pubs</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award style={{ width: '16px', height: '16px', color: colors.grey[300] }} />
                  <span style={{ color: colors.grey[300], fontSize: '13px' }}>h-index: {researcher.hIndex}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href={`mailto:${researcher.email}`}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    backgroundColor: colors.greenAccent[600],
                    color: colors.grey[900],
                    border: 'none',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <Mail style={{ width: '16px', height: '16px' }} />
                  Contact
                </a>
                <button
                  style={{
                    padding: '10px 16px',
                    backgroundColor: 'transparent',
                    color: colors.grey[300],
                    border: `1px solid ${colors.primary[300]}`,
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <ExternalLink style={{ width: '16px', height: '16px' }} />
                </button>
              </div>

            </div>
          ))}
        </div>

        {filteredResearchers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: colors.grey[300] }}>
            <Users style={{ width: '64px', height: '64px', margin: '0 auto 16px', opacity: 0.3 }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>
              No researchers found
            </h3>
            <p style={{ fontSize: '14px', margin: 0 }}>
              Try adjusting your search criteria or filters
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default SearchCollab;

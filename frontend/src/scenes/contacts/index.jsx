import React, { useState, useMemo, createContext } from 'react';
import { Box, Typography, useTheme } from "@mui/material";
import { Search, Users, BookOpen, Award, MapPin, Mail, ExternalLink, Home, UserCircle, Settings, BarChart3, FileText, Menu, X, Sun, Moon } from 'lucide-react';
import { tokens } from "../../theme";
const ResearcherDashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [mode, setMode] = useState("dark");
  const [currentPage, setCurrentPage] = useState("discover");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState('all');
  const [selectedInstitution, setSelectedInstitution] = useState('all');


  const toggleColorMode = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Sample data
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

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'discover', label: 'Discover Researchers', icon: Users },
    { id: 'profile', label: 'My Profile', icon: UserCircle },
    { id: 'publications', label: 'Publications', icon: FileText },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const allExpertises = [...new Set(researchers.flatMap(r => r.expertises))].sort();
  const allInstitutions = [...new Set(researchers.map(r => r.institution))].sort();

  const filteredResearchers = researchers.filter(researcher => {
    const matchesSearch = searchTerm === '' || 
      researcher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      researcher.expertises.some(exp => exp.toLowerCase().includes(searchTerm.toLowerCase())) ||
      researcher.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesExpertise = selectedExpertise === 'all' || 
      researcher.expertises.includes(selectedExpertise);
    
    const matchesInstitution = selectedInstitution === 'all' || 
      researcher.institution === selectedInstitution;

    return matchesSearch && matchesExpertise && matchesInstitution;
  });

  const bgColor = mode === "dark" ? colors.primary[500] : "#fcfcfc";
  const cardBg = mode === "dark" ? colors.primary[400] : "#ffffff";
  const textColor = mode === "dark" ? colors.grey[100] : colors.grey[100];
  const textSecondary = mode === "dark" ? colors.grey[300] : colors.grey[300];
  const borderColor = mode === "dark" ? colors.primary[300] : colors.grey[800];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: bgColor }}>
      {/* Sidebar */}
      <div
        style={{
          width: sidebarOpen ? '280px' : '0',
          backgroundColor: cardBg,
          borderRight: `1px solid ${borderColor}`,
          transition: 'width 0.3s ease',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <div style={{ padding: '24px', width: '280px' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
            <Users style={{ width: '32px', height: '32px', color: colors.blueAccent[500] }} />
            <div>
              <h2 style={{ color: textColor, fontSize: '20px', fontWeight: 'bold', margin: 0 }}>ResearchConnect</h2>
              <p style={{ color: textSecondary, fontSize: '12px', margin: 0 }}>Discover Excellence</p>
            </div>
          </div>

          {/* Navigation */}
          <nav>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    marginBottom: '4px',
                    backgroundColor: isActive ? colors.blueAccent[700] : 'transparent',
                    color: isActive ? colors.blueAccent[100] : textSecondary,
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: isActive ? '600' : '400',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = mode === "dark" ? colors.primary[600] : colors.grey[900];
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Icon style={{ width: '20px', height: '20px' }} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ backgroundColor: cardBg, borderBottom: `1px solid ${borderColor}`, padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  color: textColor
                }}
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <h1 style={{ color: textColor, fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                {menuItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
              </h1>
            </div>
            <button
              onClick={toggleColorMode}
              style={{
                padding: '8px 16px',
                backgroundColor: colors.blueAccent[700],
                color: colors.blueAccent[100],
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              {mode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              {mode === 'dark' ? 'Light' : 'Dark'} Mode
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {currentPage === 'discover' && (
            <>
              {/* Search and Filters */}
              <div style={{ backgroundColor: cardBg, borderRadius: '12px', border: `1px solid ${borderColor}`, padding: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  {/* Search Bar */}
                  <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: textSecondary, width: '20px', height: '20px' }} />
                    <input
                      type="text"
                      placeholder="Search by name, expertise, or title..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 44px',
                        backgroundColor: mode === "dark" ? colors.primary[600] : colors.grey[900],
                        color: textColor,
                        border: `1px solid ${borderColor}`,
                        borderRadius: '8px',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    {/* Expertise Filter */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: textSecondary, marginBottom: '8px' }}>Expertise Area</label>
                      <select
                        value={selectedExpertise}
                        onChange={(e) => setSelectedExpertise(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          backgroundColor: mode === "dark" ? colors.primary[600] : colors.grey[900],
                          color: textColor,
                          border: `1px solid ${borderColor}`,
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

                    {/* Institution Filter */}
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: textSecondary, marginBottom: '8px' }}>Institution</label>
                      <select
                        value={selectedInstitution}
                        onChange={(e) => setSelectedInstitution(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          backgroundColor: mode === "dark" ? colors.primary[600] : colors.grey[900],
                          color: textColor,
                          border: `1px solid ${borderColor}`,
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

                    {/* Clear Filters */}
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

              {/* Results Count */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: textSecondary, fontSize: '14px' }}>
                <Users style={{ width: '16px', height: '16px' }} />
                <span>{filteredResearchers.length} researchers found</span>
              </div>

              {/* Results Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                {filteredResearchers.map(researcher => (
                  <div
                    key={researcher.id}
                    style={{
                      backgroundColor: cardBg,
                      borderRadius: '12px',
                      border: `1px solid ${borderColor}`,
                      padding: '24px',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = mode === "dark" ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ marginBottom: '16px' }}>
                      <h3 style={{ color: textColor, fontSize: '18px', fontWeight: '600', margin: '0 0 4px 0' }}>{researcher.name}</h3>
                      <p style={{ color: textSecondary, fontSize: '14px', margin: 0 }}>{researcher.title}</p>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <MapPin style={{ width: '16px', height: '16px', color: textSecondary }} />
                        <span style={{ color: textSecondary, fontSize: '13px' }}>{researcher.institution}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin style={{ width: '16px', height: '16px', color: textSecondary }} />
                        <span style={{ color: textSecondary, fontSize: '13px' }}>{researcher.location}</span>
                      </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <p style={{ color: textSecondary, fontSize: '11px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>Research Areas</p>
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

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', paddingTop: '16px', borderTop: `1px solid ${borderColor}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BookOpen style={{ width: '16px', height: '16px', color: textSecondary }} />
                        <span style={{ color: textSecondary, fontSize: '13px' }}>{researcher.publications} pubs</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Award style={{ width: '16px', height: '16px', color: textSecondary }} />
                        <span style={{ color: textSecondary, fontSize: '13px' }}>h-index: {researcher.hIndex}</span>
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
                          color: textSecondary,
                          border: `1px solid ${borderColor}`,
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
                <div style={{ textAlign: 'center', padding: '48px', color: textSecondary }}>
                  <Users style={{ width: '64px', height: '64px', margin: '0 auto 16px', opacity: 0.3 }} />
                  <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px 0' }}>No researchers found</h3>
                  <p style={{ fontSize: '14px', margin: 0 }}>Try adjusting your search criteria or filters</p>
                </div>
              )}
            </>
          )}

          {currentPage === 'dashboard' && (
            <div style={{ color: textColor }}>
              <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Welcome to ResearchConnect</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                <div style={{ backgroundColor: cardBg, padding: '24px', borderRadius: '12px', border: `1px solid ${borderColor}` }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '8px', color: colors.blueAccent[400] }}>Total Researchers</h3>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>{researchers.length}</p>
                </div>
                <div style={{ backgroundColor: cardBg, padding: '24px', borderRadius: '12px', border: `1px solid ${borderColor}` }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '8px', color: colors.greenAccent[400] }}>Institutions</h3>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>{allInstitutions.length}</p>
                </div>
                <div style={{ backgroundColor: cardBg, padding: '24px', borderRadius: '12px', border: `1px solid ${borderColor}` }}>
                  <h3 style={{ fontSize: '16px', marginBottom: '8px', color: colors.greenAccent[400] }}>Research Areas</h3>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>{allExpertises.length}</p>
                </div>
              </div>
            </div>
          )}

          {currentPage !== 'discover' && currentPage !== 'dashboard' && (
            <div style={{ textAlign: 'center', padding: '48px', color: textSecondary }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{menuItems.find(item => item.id === currentPage)?.label}</h3>
              <p style={{ fontSize: '14px' }}>This page is under construction</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResearcherDashboard;
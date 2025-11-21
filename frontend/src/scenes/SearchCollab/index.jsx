/*
Filename: index.jsx
Author: Lucas Matheson
Edited by: Lucas Matheson
Date: November 20, 2025

The goal of this page is to allow a user to search for researchers based on 
a name, expertise, or institution. 

*/

import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';
import { Box } from "@mui/material";
import {
  Search,
  Users,
  BookOpen,
  MapPin,
  Mail,
} from "lucide-react";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ResearcherCard = memo(({ researcher, projects, colors, theme }) => {
  const navigate = useNavigate();

  const handleMouseEnter = useCallback((e) => {
    e.currentTarget.style.transform = "translateY(-4px)";
    e.currentTarget.style.boxShadow =
      theme.palette.mode === "dark"
        ? "0 8px 24px rgba(0,0,0,0.4)"
        : "0 8px 24px rgba(0,0,0,0.1)";
  }, [theme.palette.mode]);

  const handleMouseLeave = useCallback((e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "none";
  }, []);

  const handleCardClick = useCallback(() => {
    navigate(`/person/${researcher.person_id}`);
  }, [navigate, researcher.person_id]);

  const handleInstitutionClick = useCallback((e) => {
    e.stopPropagation();
    navigate(`/institution/${researcher.institution_id}`);
  }, [navigate, researcher.institution_id]);

  const handleDepartmentClick = useCallback((e) => {
    e.stopPropagation();
    navigate(`/department/${researcher.department_id}`);
  }, [navigate, researcher.department_id]);

  const handleEmailClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const validExpertises = useMemo(
    () => researcher.expertises.filter((exp) => exp),
    [researcher.expertises]
  );

  return (
    <div
      style={{
        backgroundColor: colors.primary[400],
        borderRadius: "12px",
        border: `1px solid ${colors.primary[300]}`,
        padding: "24px",
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        minHeight: "260px",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
    >
      <div style={{ marginBottom: "16px" }}>
        <h3
          style={{
            color: colors.grey[100],
            fontSize: "18px",
            fontWeight: "600",
            margin: "0 0 4px 0",
          }}
        >
          {researcher.person_name}
        </h3>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <div
          onClick={handleInstitutionClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
            cursor: "pointer",
            padding: "4px 8px",
            marginLeft: "-8px",
            borderRadius: "4px",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.primary[300];
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <MapPin
            style={{
              width: "16px",
              height: "16px",
              color: colors.grey[300],
            }}
          />
          <span style={{ color: colors.grey[300], fontSize: "13px" }}>
            {researcher.institution_name}
          </span>
        </div>
        <div
          onClick={handleDepartmentClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            padding: "4px 8px",
            marginLeft: "-8px",
            borderRadius: "4px",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = colors.primary[300];
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <MapPin
            style={{
              width: "16px",
              height: "16px",
              color: colors.grey[300],
            }}
          />
          <span style={{ color: colors.grey[300], fontSize: "13px" }}>
            {researcher.department_name}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <p
          style={{
            color: colors.grey[300],
            fontSize: "11px",
            fontWeight: "600",
            marginBottom: "8px",
            textTransform: "uppercase",
          }}
        >
          Research Areas
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {validExpertises.length > 0 ? (
            validExpertises.map((exp, idx) => (
              <span
                key={idx}
                style={{
                  padding: "4px 12px",
                  backgroundColor: colors.blueAccent[800],
                  color: colors.blueAccent[200],
                  borderRadius: "16px",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                {exp}
              </span>
            ))
          ) : (
            <span style={{ fontSize: "12px", color: colors.grey[400] }}>
              No Research Areas Listed
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "16px",
          paddingTop: "16px",
          borderTop: `1px solid ${colors.primary[300]}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <BookOpen
            style={{
              width: "16px",
              height: "16px",
              color: colors.grey[300],
            }}
          />
          <span style={{ color: colors.grey[300], fontSize: "13px" }}>
            {projects} Total Number of Projects
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
        <a
          href={`mailto:${researcher.person_email}`}
          onClick={handleEmailClick}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "10px 16px",
            backgroundColor: colors.greenAccent[600],
            color: colors.grey[900],
            border: "none",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          <Mail style={{ width: "16px", height: "16px" }} />
          Contact
        </a>
      </div>
    </div>
  );
});


const SearchCollab = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState("all");
  const [selectedInstitution, setSelectedInstitution] = useState("all");
  const [researchers, setResearchers] = useState([]);
  const [numProjectsPerPerson, setProjects] = useState({});

  useEffect(() => {
    axios
      .get("http://127.0.0.1:5000/institution/all")
      .then((response) => {
        setResearchers(response.data.data);
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, []);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:5000/project/num-projects-per-person")
      .then((response) => {
        setProjects(response.data.data);
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, []);
  console.log(numProjectsPerPerson)
  const allExpertises = useMemo(
    () => [
      ...new Set((researchers || []).flatMap((r) => r.expertises || [])),
    ].sort(),
    [researchers]
  );

  const allInstitutions = useMemo(
    () => [
      ...new Set((researchers || []).map((r) => r.institution_name || "")),
    ].sort(),
    [researchers]
  );

  const filteredResearchers = useMemo(() => {
    return researchers.filter((researcher) => {
      const expertises = researcher.expertises || [];

      const matchesSearch =
        searchTerm === "" ||
        researcher.person_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        expertises.some((exp) =>
          exp?.toLowerCase().includes(searchTerm.toLowerCase())
        ) ||
        researcher.title?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesExpertise =
        selectedExpertise === "all" || expertises.includes(selectedExpertise);

      const matchesInstitution =
        selectedInstitution === "all" ||
        researcher.institution_name === selectedInstitution;

      return matchesSearch && matchesExpertise && matchesInstitution;
    });
  }, [researchers, searchTerm, selectedExpertise, selectedInstitution]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: colors.primary[500],
      }}
    >
      <Box m="20px 20px 0px 20px">
        <Header
          title="Search Collaborators"
          subtitle="Search for Potential Collaborators"
        />
      </Box>

      <div
        style={{ flex: 1, padding: "24px 24px 0px 24px", overflowY: "auto" }}
      >
        <div
          style={{
            backgroundColor: colors.primary[400],
            borderRadius: "12px",
            border: `1px solid ${colors.primary[300]}`,
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr", gap: "16px" }}
          >
            <div style={{ position: "relative" }}>
              <Search
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: colors.grey[300],
                  width: "20px",
                  height: "20px",
                }}
              />
              <input
                type="text"
                placeholder="Search by name, expertise, or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 12px 12px 44px",
                  backgroundColor:
                    theme.palette.mode === "dark"
                      ? colors.primary[600]
                      : colors.grey[900],
                  color: colors.grey[100],
                  border: `1px solid ${colors.primary[300]}`,
                  borderRadius: "8px",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: colors.grey[300],
                    marginBottom: "8px",
                  }}
                >
                  Expertise Area
                </label>
                <select
                  value={selectedExpertise}
                  onChange={(e) => setSelectedExpertise(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? colors.primary[600]
                        : colors.grey[900],
                    color: colors.grey[100],
                    border: `1px solid ${colors.primary[300]}`,
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                >
                  <option value="all">All Expertises</option>
                  {allExpertises.map((exp) => (
                    <option key={exp} value={exp}>
                      {exp}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: colors.grey[300],
                    marginBottom: "8px",
                  }}
                >
                  Institution
                </label>
                <select
                  value={selectedInstitution}
                  onChange={(e) => setSelectedInstitution(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    backgroundColor:
                      theme.palette.mode === "dark"
                        ? colors.primary[600]
                        : colors.grey[900],
                    color: colors.grey[100],
                    border: `1px solid ${colors.primary[300]}`,
                    borderRadius: "8px",
                    fontSize: "14px",
                    outline: "none",
                  }}
                >
                  <option value="all">All Institutions</option>
                  {allInstitutions.map((inst) => (
                    <option key={inst} value={inst}>
                      {inst}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "flex-end" }}>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedExpertise("all");
                    setSelectedInstitution("all");
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 16px",
                    backgroundColor: colors.greenAccent[700],
                    color: colors.greenAccent[100],
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "16px",
            color: colors.grey[300],
            fontSize: "14px",
          }}
        >
          <Users style={{ width: "16px", height: "16px" }} />
          <span>{filteredResearchers.length} researchers found</span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: "24px",
            maxHeight: "53.1vh",
            overflowY: "auto",
            paddingTop: "5px",
          }}
        >
          {filteredResearchers.map((researcher) => (
            <ResearcherCard
              key={researcher.person_id}
              researcher={researcher}
              projects={numProjectsPerPerson[researcher.person_id]?.num_projects ?? 0}
              colors={colors}
              theme={theme}
            />
          ))}
        </div>

        {filteredResearchers.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "48px",
              color: colors.grey[300],
            }}
          >
            <Users
              style={{
                width: "64px",
                height: "64px",
                margin: "0 auto 16px",
                opacity: 0.3,
              }}
            />
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                margin: "0 0 8px 0",
              }}
            >
              No researchers found
            </h3>
            <p style={{ fontSize: "14px", margin: 0 }}>
              Try adjusting your search criteria or filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchCollab;
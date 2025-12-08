/*
Filename: index.jsx
Author: GitHub Copilot, and modified by Abbas Jabor
Date: November 30, 2025

The goal of this page is to allow a user to search for projects based on 
project name, tags, or institution.
*/

import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';
import { Box } from "@mui/material";
import {
  Search,
  Calendar,
} from "lucide-react";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ProjectCard = memo(({ project, colors, theme }) => {
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
    navigate(`/project/${project.project_id}`);
  }, [navigate, project.project_id]);

  // Institution details aren't available on the basic project list payload;
  // navigate via the detail page instead.

  const validTags = useMemo(() => {
    if (Array.isArray(project.tags)) return project.tags.filter(Boolean);
    if (project.tag_name) return [project.tag_name];
    return [];
  }, [project.tags, project.tag_name]);

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
          {project.project_title || project.title || project.project_name}
        </h3>
      </div>

      <div style={{ marginBottom: "16px" }}>
        {/* Institution is shown on the detail page; omitted here for now */}
        {project.start_date && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "4px 8px",
              marginLeft: "-8px",
            }}
          >
            <Calendar
              style={{
                width: "16px",
                height: "16px",
                color: colors.grey[300],
              }}
            />
            <span style={{ color: colors.grey[300], fontSize: "13px" }}>
              {new Date(project.start_date).getFullYear()}
            </span>
          </div>
        )}
      </div>

      {(project.project_description || project.description) && (
        <div style={{ marginBottom: "16px", flex: 1 }}>
          <p
            style={{
              color: colors.grey[200],
              fontSize: "14px",
              lineHeight: "1.6",
              margin: 0,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {project.project_description || project.description}
          </p>
        </div>
      )}

      {validTags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {validTags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              style={{
                backgroundColor: colors.blueAccent[700],
                color: colors.grey[100],
                padding: "4px 12px",
                borderRadius: "16px",
                fontSize: "12px",
                fontWeight: "500",
              }}
            >
              {tag}
            </span>
          ))}
          {validTags.length > 3 && (
            <span
              style={{
                color: colors.grey[300],
                padding: "4px 12px",
                fontSize: "12px",
              }}
            >
              +{validTags.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );
});

const SearchProjects = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get("/project/all");
        const list = response.data?.data || [];
        setProjects(list);
        setFilteredProjects(list);
        setError(null);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError("Failed to load projects. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProjects(projects);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = projects.filter((project) => {
      const title = (project.project_title || project.title || project.project_name || "").toLowerCase();
      const desc = (project.project_description || project.description || "").toLowerCase();
      const tags = Array.isArray(project.tags) ? project.tags : (project.tag_name ? [project.tag_name] : []);
      const titleMatch = title.includes(query);
      const descMatch = desc.includes(query);
      const tagMatch = tags.some((t) => (t || "").toLowerCase().includes(query));
      return titleMatch || descMatch || tagMatch;
    });

    setFilteredProjects(filtered);
  }, [searchQuery, projects]);

  return (
    <Box m="20px">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb="20px"
      >
        <Header title="Project Search" subtitle="Find research projects and collaborations" />
      </Box>

      <Box
        sx={{
          backgroundColor: colors.primary[400],
          borderRadius: "12px",
          padding: "16px 24px",
          marginBottom: "24px",
          border: `1px solid ${colors.primary[300]}`,
        }}
      >
        <div style={{ position: "relative" }}>
          <Search
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "20px",
              height: "20px",
              color: colors.grey[300],
            }}
          />
          <input
            type="text"
            placeholder="Search by project name, institution, tags, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 12px 12px 44px",
              backgroundColor: colors.primary[500],
              border: `1px solid ${colors.primary[300]}`,
              borderRadius: "8px",
              color: colors.grey[100],
              fontSize: "14px",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = colors.blueAccent[500];
            }}
            onBlur={(e) => {
              e.target.style.borderColor = colors.primary[300];
            }}
          />
        </div>
      </Box>

      <Box>
        {isLoading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="400px"
          >
            <div style={{ color: colors.grey[100], fontSize: "18px" }}>
              Loading projects...
            </div>
          </Box>
        ) : error ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="400px"
          >
            <div style={{ color: colors.redAccent[500], fontSize: "18px" }}>
              {error}
            </div>
          </Box>
        ) : filteredProjects.length === 0 ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="400px"
          >
            <div style={{ color: colors.grey[300], fontSize: "18px" }}>
              {searchQuery
                ? "No projects found matching your search."
                : "No projects available."}
            </div>
          </Box>
        ) : (
          <>
            <Box
              sx={{
                marginBottom: "16px",
                color: colors.grey[300],
                fontSize: "14px",
              }}
            >
              Found {filteredProjects.length} project{filteredProjects.length !== 1 ? "s" : ""}
            </Box>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
                gap: "24px",
              }}
            >
              {filteredProjects.map((project) => (
                <ProjectCard
                  key={project.project_id}
                  project={project}
                  colors={colors}
                  theme={theme}
                />
              ))}
            </div>
          </>
        )}
      </Box>
    </Box>
  );
};

export default SearchProjects;

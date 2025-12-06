/*
Filename: Detail.jsx
Purpose: Project detail page showing project info and associated people.
Author: Abbas Jabor and Copilot
Date: Nov 30, 2025
*/

import React, { useEffect, useMemo, useState } from 'react';
import { Box } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material';
import { tokens } from '../../theme';
import Header from '../../components/Header';
import axios from 'axios';
import { Calendar, Tag, Users, MapPin, ArrowRight } from 'lucide-react';

const PersonMiniCard = ({ person, colors, onClick }) => (
  <div
    onClick={onClick}
    style={{
      backgroundColor: colors.primary[400],
      border: `1px solid ${colors.primary[300]}`,
      borderRadius: 10,
      padding: '14px 16px',
      cursor: 'pointer',
      transition: 'transform .15s ease',
    }}
    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-3px)')}
    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <div style={{ color: colors.grey[100], fontWeight: 600 }}>{person.person_name}</div>
        <div style={{ color: colors.grey[300], fontSize: 12 }}>
          {person.department_name || '—'}
        </div>
        <div style={{ color: colors.grey[400], fontSize: 12, display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
          <MapPin style={{ width: 14, height: 14 }} />
          <span>{person.institution_name || '—'}</span>
        </div>
      </div>
      <ArrowRight style={{ width: 18, height: 18, color: colors.grey[300] }} />
    </div>
  </div>
);

export default function ProjectDetail() {
  const { id } = useParams();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [people, setPeople] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        setLoading(true);
        const [pRes, peepRes, tagRes] = await Promise.all([
          axios.get(`http://localhost:5000/project/${id}`),
          axios.get(`http://localhost:5000/project/${id}/people`),
          axios.get(`http://localhost:5000/project_tag/by-project`, { params: { project_id: id } }),
        ]);

        if (ignore) return;
        setProject(pRes.data?.data || null);
        setPeople(peepRes.data?.data || []);
        const tagList = (tagRes.data?.data || []).map((t) => t.tag_name || t.name).filter(Boolean);
        setTags(tagList);
        setError(null);
      } catch (e) {
        console.error('Failed loading project detail', e);
        setError('Failed to load project details.');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [id]);

  const title = useMemo(() => {
    if (!project) return '';
    return project.project_title || project.title || `Project ${project.project_id || id}`;
  }, [project, id]);

  const description = project?.project_description || project?.description || '';

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center" mb="20px">
        <Header title="Project" subtitle={title} />
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <div style={{ color: colors.grey[100] }}>Loading project...</div>
        </Box>
      ) : error ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <div style={{ color: colors.redAccent[500] }}>{error}</div>
        </Box>
      ) : !project ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <div style={{ color: colors.grey[300] }}>Project not found</div>
        </Box>
      ) : (
        <>
          {/* Overview */}
          <Box
            sx={{
              backgroundColor: colors.primary[400],
              border: `1px solid ${colors.primary[300]}`,
              borderRadius: 12,
              padding: '18px 22px',
              mb: '20px',
            }}
          >
            <div style={{ color: colors.grey[100], fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Overview
            </div>
            <div style={{ color: description ? colors.grey[200] : colors.grey[400], lineHeight: 1.6, marginBottom: 12, fontStyle: description ? 'normal' : 'italic' }}>
              {description || 'No description provided'}
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: project.start_date ? colors.grey[300] : colors.grey[400] }}>
                <Calendar style={{ width: 16, height: 16 }} />
                <span>Start: {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not specified'}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: project.end_date ? colors.grey[300] : colors.grey[400] }}>
                <Calendar style={{ width: 16, height: 16 }} />
                <span>End: {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not specified'}</span>
              </div>
            </div>
          </Box>

          {/* Tags */}
          <Box
            sx={{
              backgroundColor: colors.primary[400],
              border: `1px solid ${colors.primary[300]}`,
              borderRadius: 12,
              padding: '14px 18px',
              mb: '20px',
            }}
          >
            <div style={{ color: colors.grey[100], fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tag style={{ width: 16, height: 16 }} /> Tags
            </div>
            {tags.length === 0 ? (
              <div style={{ color: colors.grey[400], fontStyle: 'italic' }}>No tags assigned</div>
            ) : (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {tags.map((t, i) => (
                  <span key={i} style={{ backgroundColor: colors.blueAccent[700], color: colors.grey[100], padding: '6px 10px', borderRadius: 16, fontSize: 12 }}>
                    {t}
                  </span>
                ))}
              </div>
            )}
          </Box>

          {/* People */}
          <Box
            sx={{
              backgroundColor: colors.primary[400],
              border: `1px solid ${colors.primary[300]}`,
              borderRadius: 12,
              padding: '14px 18px',
            }}
          >
            <div style={{ color: colors.grey[100], fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users style={{ width: 18, height: 18 }} /> People on this project ({people.length})
            </div>
            {people.length === 0 ? (
              <div style={{ color: colors.grey[300] }}>No people associated yet.</div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 16,
              }}>
                {people.map((p) => (
                  <PersonMiniCard
                    key={p.person_id}
                    person={p}
                    colors={colors}
                    onClick={() => navigate(`/person/${p.person_id}`)}
                  />
                ))}
              </div>
            )}
          </Box>
        </>
      )}
    </Box>
  );
}

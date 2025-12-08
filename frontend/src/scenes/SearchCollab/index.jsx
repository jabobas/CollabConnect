/*
  author: Lucas Matheson
  edited by: Lucas Matheson
  date: November 24th, 2025
  description: Scene for searching and displaying collaborators
*/
import React, { memo, useCallback, useMemo, useState, useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { Search, Users, BookOpen, MapPin, Mail } from "lucide-react";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { toggleFavorite, isFavorite } from "../../utils/favoritesManager";
const ResearcherCard = memo(({ researcher, projects, colors, theme, onFavoriteToggle }) => {
  const navigate = useNavigate();
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    setIsFavorited(isFavorite(researcher.person_id));
  }, [researcher.person_id]);

  const handleMouseEnter = useCallback(
    (e) => {
      e.currentTarget.style.transform = "translateY(-4px)";
      e.currentTarget.style.boxShadow =
        theme.palette.mode === "dark"
          ? "0 8px 24px rgba(0,0,0,0.4)"
          : "0 8px 24px rgba(0,0,0,0.1)";
    },
    [theme.palette.mode]
  );

  const handleMouseLeave = useCallback((e) => {
    e.currentTarget.style.transform = "translateY(0)";
    e.currentTarget.style.boxShadow = "none";
  }, []);

  const handleCardClick = useCallback(() => {
    navigate(`/person/${researcher.person_id}`);
  }, [navigate, researcher.person_id]);

  const handleInstitutionClick = useCallback(
    (e) => {
      e.stopPropagation();
      navigate(`/institution/${researcher.institution_id}`);
    },
    [navigate, researcher.institution_id]
  );

  const handleDepartmentClick = useCallback(
    (e) => {
      e.stopPropagation();
      navigate(`/department/${researcher.department_id}`);
    },
    [navigate, researcher.department_id]
  );

  const handleEmailClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handleFavoriteClick = useCallback((e) => {
    e.stopPropagation();
    const newStatus = toggleFavorite(researcher.person_id);
    setIsFavorited(newStatus);
    if (onFavoriteToggle) {
      onFavoriteToggle();
    }
  }, [researcher.person_id, onFavoriteToggle]);

  const validExpertises = useMemo(
    () => researcher.expertises?.filter((exp) => exp && exp.trim() !== "") || [],
    [researcher.expertises]
  );

  return (
    <div
      style={{
        backgroundColor: colors.primary[400],
        borderRadius: "12px",
        padding: "24px",
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        minHeight: "260px",
        boxShadow: " rgba(100, 100, 111, 0.2) 0px 7px 29px 0px;",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleCardClick}
    >
      <div style={{ marginBottom: "16px", display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
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
        <div 
          style={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s',
            color: isFavorited ? colors.redAccent[500] : colors.grey[300],
          }}
          onClick={handleFavoriteClick}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isFavorited ? <FavoriteIcon /> : <FavoriteBorderIcon />}
        </div>
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
            padding: "2px 8px",
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

      <div style={{ marginBottom: "15px" }}>
        <p
          style={{
            color: colors.grey[300],
            fontSize: "13px",
            fontWeight: "500",
            marginBottom: "8px",
          }}
        >
          Research Areas:
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {validExpertises.length > 0 ? (
            validExpertises.map((exp, idx) => (
              <span
                key={idx}
                style={{
                  padding: "4px 12px",
                  backgroundColor: colors.blueAccent[800],
                  color: colors.primary[100],
                  borderRadius: "16px",
                  fontSize: "12px",
                  fontWeight: "600",
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
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "13px",
            fontWeight: "700",
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

// Custom hook for virtualization with throttling
const useVirtualization = (items, containerRef) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 30 });
  const [containerWidth, setContainerWidth] = useState(1000);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId = null;
    let timeoutId = null;

    const handleScroll = () => {
      // Cancel any pending animation frame
      if (rafId) {
        cancelAnimationFrame(rafId);
      }

      // Use requestAnimationFrame to throttle scroll calculations
      rafId = requestAnimationFrame(() => {
        const scrollTop = container.scrollTop;
        const containerHeight = container.clientHeight;
        const itemHeight = 308; // Card height (260) + gap (24) + padding (24)
        const itemsPerRow = Math.max(1, Math.floor(containerWidth / 344)); // 320 + 24 gap
        
        const startRow = Math.max(0, Math.floor(scrollTop / itemHeight) - 1);
        const endRow = Math.ceil((scrollTop + containerHeight) / itemHeight) + 1;
        
        const start = startRow * itemsPerRow;
        const end = Math.min(items.length, endRow * itemsPerRow);
        
        setVisibleRange({ start, end });
      });
    };

    const handleResize = () => {
      // Debounce resize calculations
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        setContainerWidth(container.clientWidth);
        handleScroll();
      }, 150);
    };

    // Initial setup
    setContainerWidth(container.clientWidth);
    handleScroll();

    container.addEventListener('scroll', handleScroll, { passive: true });
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [items.length, containerWidth]);

  return { visibleRange, containerWidth };
};

const SearchCollab = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const containerRef = useRef(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState("all");
  const [selectedInstitution, setSelectedInstitution] = useState("all");
  const [researchers, setResearchers] = useState([]);
  const [numProjectsPerPerson, setProjects] = useState({});
  const [favoritesUpdateTrigger, setFavoritesUpdateTrigger] = useState(0);

  const handleFavoriteToggle = useCallback(() => {
    setFavoritesUpdateTrigger(prev => prev + 1);
  }, []);

  // Add style tag for hiding scrollbar
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:5001/institution/all")
      .then((response) => {
        setResearchers(response.data.data);
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, []);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:5001/project/num-projects-per-person")
      .then((response) => {
        setProjects(response.data.data);
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, []);

  const allExpertises = useMemo(
    () =>
      [
        ...new Set(
          (researchers || [])
            .flatMap((r) => r.expertises || [])
            .filter((exp) => exp && exp.trim() !== "")
        ),
      ].sort(),
    [researchers]
  );

  const allInstitutions = useMemo(
    () =>
      [
        ...new Set(
          (researchers || [])
            .map((r) => r.institution_name || "")
            .filter((inst) => inst && inst.trim() !== "")
        ),
      ].sort(),
    [researchers]
  );

  const filteredResearchers = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    
    return researchers.filter((researcher) => {
      if (!researcher.person_name || researcher.person_name.trim() === "") {
        return false;
      }

      const expertises = researcher.expertises || [];

      const matchesSearch =
        searchTerm === "" ||
        researcher.person_name?.toLowerCase().includes(searchLower) ||
        expertises.some((exp) => exp?.toLowerCase().includes(searchLower)) ||
        researcher.title?.toLowerCase().includes(searchLower);

      const matchesExpertise =
        selectedExpertise === "all" || expertises.includes(selectedExpertise);

      const matchesInstitution =
        selectedInstitution === "all" ||
        researcher.institution_name === selectedInstitution;

      return matchesSearch && matchesExpertise && matchesInstitution;
    });
  }, [researchers, searchTerm, selectedExpertise, selectedInstitution]);

  const { visibleRange, containerWidth } = useVirtualization(filteredResearchers, containerRef);
  
  const visibleResearchers = useMemo(() => {
    return filteredResearchers.slice(visibleRange.start, visibleRange.end);
  }, [filteredResearchers, visibleRange.start, visibleRange.end]);

  const { totalHeight, itemsPerRow, offsetTop } = useMemo(() => {
    const itemsPerRow = Math.max(1, Math.floor(containerWidth / 344));
    const numRows = Math.ceil(filteredResearchers.length / itemsPerRow);
    const totalHeight = numRows * 308;
    const startRow = Math.floor(visibleRange.start / itemsPerRow);
    const offsetTop = startRow * 308;
    
    return { totalHeight, itemsPerRow, offsetTop };
  }, [filteredResearchers.length, containerWidth, visibleRange.start]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        backgroundColor: colors.primary[500],
        height: "92.2vh",
        overflowY: "hidden",
        width: "100%",
      }}
    >
      <Box m="20px 20px 0px 20px" sx={{ flexShrink: 0 }}>
        <Header
          title="Search Collaborators"
          subtitle="Search for Potential Collaborators"
        />
      </Box>

      <div
        style={{ 
          flex: 1, 
          padding: "0px 24px", 
          overflow: "hidden", 
          display: "flex", 
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <div
          style={{
            backgroundColor: colors.primary[400],
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px",
            flexShrink: 0,
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
                  {allInstitutions.map((inst, idx) => (
                    <option key={inst || `inst-${idx}`} value={inst}>
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
            flexShrink: 0,
          }}
        >
          <Users style={{ width: "16px", height: "16px" }} />
          <span>{filteredResearchers.length} researchers found</span>
        </div>

        <div
          ref={containerRef}
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            position: "relative",
            scrollbarWidth: "none", 
            msOverflowStyle: "none", 
          }}
        >
          {filteredResearchers.length > 0 ? (
            <div style={{ height: `${totalHeight}px`, position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  top: `${offsetTop}px`,
                  width: "100%",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: "24px",
                  paddingTop: "5px",
                }}
              >
                {visibleResearchers.map((researcher) => (
                  <ResearcherCard
                    key={researcher.person_id}
                    researcher={researcher}
                    projects={
                      numProjectsPerPerson[researcher.person_id]?.num_projects ?? 0
                    }
                    colors={colors}
                    theme={theme}
                    onFavoriteToggle={handleFavoriteToggle}
                  />
                ))}
              </div>
            </div>
          ) : (
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
    </div>
  );
};

export default SearchCollab;
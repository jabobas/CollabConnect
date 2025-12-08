/*
  author: Lucas Matheson
  date: December 7th, 2025
  description: Connections page displaying favorited researchers and recommended collaborators
*/
import React, { useState, useEffect } from "react";
import { Box, CircularProgress, Tabs, Tab } from "@mui/material";
import { useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { getFavorites, removeFavorite, addFavorite } from "../../utils/favoritesManager";
import { Users, Star, Sparkles, X, Mail, MapPin, BookOpen, Briefcase, Heart } from "lucide-react";

const Connections = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState(0);
  const [favoritedResearchers, setFavoritedResearchers] = useState([]);
  const [recommendedResearchers, setRecommendedResearchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get favorited researcher IDs from localStorage
      const favoriteIds = getFavorites();

      if (favoriteIds.length > 0) {
        // Fetch details for each favorited researcher
        const favoritedDetails = await Promise.all(
          favoriteIds.map(async (id) => {
            try {
              const personResponse = await axios.get(`http://127.0.0.1:5001/person/${id}`);
              const projectsResponse = await axios.get(`http://127.0.0.1:5001/person/${id}/projects`);
              
              const personData = personResponse.data.data;
              
              return {
                ...personData.person,
                projects: projectsResponse.data.data || [],
                institution_name: personData.institution?.institution_name,
                department_name: personData.department?.department_name,
              };
            } catch (err) {
              console.error(`Failed to fetch researcher ${id}:`, err);
              return null;
            }
          })
        );

        setFavoritedResearchers(favoritedDetails.filter(r => r !== null));

        // Generate recommendations based on favorited researchers
        const allPeopleResponse = await axios.get('http://127.0.0.1:5001/person/all');
        const allPeople = allPeopleResponse.data.data;

        // Filter out favorited researchers and generate recommendations
        const recommendations = allPeople
          .filter(person => !favoriteIds.includes(person.person_id))
          .map(person => {
            // Calculate relevance score based on expertise overlap with improved matching
            let score = 0;
            const favoriteExpertises = favoritedDetails
              .flatMap(f => f?.expertises || [])
              .filter(e => e);
            
            const personExpertises = person.expertises || [];
            
            favoriteExpertises.forEach(favExp => {
              personExpertises.forEach(persExp => {
                // Normalize and tokenize for better matching
                const favTokens = favExp.toLowerCase().split(/\s+/);
                const persTokens = persExp.toLowerCase().split(/\s+/);
                
                // Check for any word overlap
                const hasWordOverlap = favTokens.some(ft => 
                  persTokens.some(pt => 
                    ft.includes(pt) || pt.includes(ft) || 
                    (ft.length >= 4 && pt.length >= 4 && (ft.substring(0, 4) === pt.substring(0, 4)))
                  )
                );
                
                if (hasWordOverlap) {
                  score += 1;
                }
              });
            });

            return { ...person, relevanceScore: score };
          })
          .filter(person => person.relevanceScore > 0)
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, 10);

        // Fetch projects for recommended researchers
        const recommendedWithProjects = await Promise.all(
          recommendations.map(async (person) => {
            try {
              const projectsResponse = await axios.get(`http://127.0.0.1:5001/person/${person.person_id}/projects`);
              return {
                ...person,
                projects: projectsResponse.data.data || [],
              };
            } catch (err) {
              console.error(`Failed to fetch projects for ${person.person_id}:`, err);
              return { ...person, projects: [] };
            }
          })
        );

        setRecommendedResearchers(recommendedWithProjects);
      } else {
        setFavoritedResearchers([]);
        setRecommendedResearchers([]);
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch connections:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleRemoveFavorite = (personId) => {
    // Optimistically update UI without reloading
    setFavoritedResearchers(prev => prev.filter(r => r.person_id !== personId));
    removeFavorite(personId);
    
    // Update recommendations in the background
    const favoriteIds = getFavorites().filter(id => id !== personId);
    if (favoriteIds.length > 0) {
      // Recalculate recommendations based on remaining favorites
      const remainingFavorites = favoritedResearchers.filter(r => r.person_id !== personId);
      
      axios.get('http://127.0.0.1:5001/person/all')
        .then(response => {
          const allPeople = response.data.data;
          const recommendations = allPeople
            .filter(person => !favoriteIds.includes(person.person_id))
            .map(person => {
              let score = 0;
              const favoriteExpertises = remainingFavorites
                .flatMap(f => f?.expertises || [])
                .filter(e => e);
              
              const personExpertises = person.expertises || [];
              
              favoriteExpertises.forEach(favExp => {
                personExpertises.forEach(persExp => {
                  const favTokens = favExp.toLowerCase().split(/\s+/);
                  const persTokens = persExp.toLowerCase().split(/\s+/);
                  
                  const hasWordOverlap = favTokens.some(ft => 
                    persTokens.some(pt => 
                      ft.includes(pt) || pt.includes(ft) || 
                      (ft.length >= 4 && pt.length >= 4 && (ft.substring(0, 4) === pt.substring(0, 4)))
                    )
                  );
                  
                  if (hasWordOverlap) {
                    score += 1;
                  }
                });
              });

              return { ...person, relevanceScore: score };
            })
            .filter(person => person.relevanceScore > 0)
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 10);
          
          // Fetch projects for updated recommendations
          Promise.all(
            recommendations.map(async (person) => {
              try {
                const projectsResponse = await axios.get(`http://127.0.0.1:5001/person/${person.person_id}/projects`);
                return {
                  ...person,
                  projects: projectsResponse.data.data || [],
                };
              } catch (err) {
                return { ...person, projects: [] };
              }
            })
          ).then(recommendedWithProjects => {
            setRecommendedResearchers(recommendedWithProjects);
          });
        })
        .catch(err => {
          console.error('Failed to update recommendations:', err);
        });
    } else {
      setRecommendedResearchers([]);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCardClick = (personId) => {
    navigate(`/person/${personId}`);
  };

  const handleProjectClick = (e, projectId) => {
    e.stopPropagation();
    navigate(`/project/${projectId}`);
  };

  const handleAddFavorite = async (personId) => {
    // Optimistically update UI
    const newFavorite = recommendedResearchers.find(r => r.person_id === personId);
    if (newFavorite) {
      setFavoritedResearchers(prev => [...prev, newFavorite]);
      setRecommendedResearchers(prev => prev.filter(r => r.person_id !== personId));
    }
    addFavorite(personId);
  };

  const ResearcherCard = ({ researcher, showRemove = false, showAdd = false }) => {
    const displayProjects = researcher.projects?.slice(0, 3) || [];

    return (
      <Box
        onClick={() => handleCardClick(researcher.person_id)}
        sx={{
          backgroundColor: colors.primary[400],
          borderRadius: "12px",
          padding: "24px",
          cursor: "pointer",
          transition: "all 0.3s ease",
          position: "relative",
          boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: theme.palette.mode === "dark" 
              ? "0 12px 32px rgba(0,0,0,0.5)" 
              : "0 12px 32px rgba(0,0,0,0.15)",
          },
        }}
      >
        {showRemove && (
          <Box
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveFavorite(researcher.person_id);
            }}
            sx={{
              position: "absolute",
              top: "12px",
              right: "12px",
              backgroundColor: colors.redAccent[600],
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s",
              "&:hover": {
                backgroundColor: colors.redAccent[700],
                transform: "scale(1.1)",
              },
            }}
          >
            <X size={18} color={colors.grey[100]} />
          </Box>
        )}

        {showAdd && (
          <Box
            onClick={(e) => {
              e.stopPropagation();
              handleAddFavorite(researcher.person_id);
            }}
            sx={{
              position: "absolute",
              top: "12px",
              right: "12px",
              backgroundColor: colors.greenAccent[600],
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s",
              "&:hover": {
                backgroundColor: colors.greenAccent[700],
                transform: "scale(1.1)",
              },
            }}
          >
            <Heart size={18} color={colors.grey[100]} />
          </Box>
        )}

        {/* Header */}
        <Box display="flex" alignItems="flex-start" gap="16px" mb="16px">
          <Box
            sx={{
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: colors.blueAccent[600],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Users size={28} color={colors.grey[100]} />
          </Box>
          <Box flex="1">
            <h3
              style={{
                color: colors.grey[100],
                fontSize: "20px",
                fontWeight: "600",
                margin: "0 0 4px 0",
              }}
            >
              {researcher.person_name}
            </h3>
            {researcher.institution_name && (
              <Box display="flex" alignItems="center" gap="6px" mb="4px">
                <MapPin size={14} color={colors.grey[300]} />
                <span style={{ color: colors.grey[300], fontSize: "14px" }}>
                  {researcher.institution_name}
                </span>
              </Box>
            )}
            {researcher.department_name && (
              <Box display="flex" alignItems="center" gap="6px">
                <Briefcase size={14} color={colors.grey[300]} />
                <span style={{ color: colors.grey[300], fontSize: "14px" }}>
                  {researcher.department_name}
                </span>
              </Box>
            )}
          </Box>
        </Box>

        {/* Bio */}
        {researcher.bio && (
          <Box mb="16px">
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
              {researcher.bio}
            </p>
          </Box>
        )}

        {/* Expertises */}
        {researcher.expertises && researcher.expertises.length > 0 && (
          <Box mb="16px">
            <Box display="flex" flexWrap="wrap" gap="8px">
              {researcher.expertises.map((expertise, idx) => (
                <span
                  key={idx}
                  style={{
                    backgroundColor: colors.greenAccent[700],
                    color: colors.grey[100],
                    padding: "4px 12px",
                    borderRadius: "16px",
                    fontSize: "12px",
                    fontWeight: "500",
                  }}
                >
                  {expertise}
                </span>
              ))}
            </Box>
          </Box>
        )}

        {/* Contact */}
        {researcher.person_email && (
          <Box display="flex" alignItems="center" gap="8px" mb="16px">
            <Mail size={16} color={colors.blueAccent[400]} />
            <a
              href={`mailto:${researcher.person_email}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                color: colors.blueAccent[400],
                fontSize: "14px",
                textDecoration: "none",
              }}
            >
              {researcher.person_email}
            </a>
          </Box>
        )}

        {/* Projects Section */}
        {displayProjects.length > 0 && (
          <Box
            sx={{
              borderTop: `1px solid ${colors.grey[700]}`,
              paddingTop: "16px",
              marginTop: "16px",
            }}
          >
            <Box display="flex" alignItems="center" gap="8px" mb="12px">
              <BookOpen size={18} color={colors.grey[300]} />
              <h4
                style={{
                  color: colors.grey[200],
                  fontSize: "14px",
                  fontWeight: "600",
                  margin: 0,
                }}
              >
                Recent Projects ({researcher.projects?.length || 0})
              </h4>
            </Box>
            <Box display="flex" flexDirection="column" gap="8px">
              {displayProjects.map((project) => (
                <Box
                  key={project.project_id}
                  onClick={(e) => handleProjectClick(e, project.project_id)}
                  sx={{
                    backgroundColor: colors.primary[500],
                    borderRadius: "8px",
                    padding: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    "&:hover": {
                      backgroundColor: colors.primary[600],
                      transform: "translateX(4px)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      color: colors.grey[100],
                      fontSize: "13px",
                      fontWeight: "500",
                      marginBottom: "4px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {project.project_title || "Untitled Project"}
                  </Box>
                  {project.project_description && (
                    <Box
                      sx={{
                        color: colors.grey[300],
                        fontSize: "12px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {project.project_description}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box m="20px">
        <Header title="Connections" subtitle="Manage your network and discover collaborators" />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress sx={{ color: colors.greenAccent[500] }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box m="20px">
      <Header title="Connections" subtitle="Manage your network and discover collaborators" />

      {error && (
        <Box
          backgroundColor={colors.redAccent[700]}
          borderRadius="8px"
          padding="16px"
          mb="20px"
        >
          <p style={{ color: colors.grey[100], margin: 0 }}>
            Error: {error}
          </p>
        </Box>
      )}

      {/* Tabs */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: colors.grey[700],
          mb: "24px",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            "& .MuiTab-root": {
              color: colors.grey[300],
              fontWeight: "600",
              fontSize: "16px",
              textTransform: "none",
            },
            "& .MuiTab-root.Mui-selected": {
              color: colors.greenAccent[500],
            },
            "& .MuiTabs-indicator": {
              backgroundColor: colors.greenAccent[500],
              height: "3px",
            },
          }}
        >
          <Tab
            icon={<Star size={20} />}
            iconPosition="start"
            label={`Favorites (${favoritedResearchers.length})`}
          />
          <Tab
            icon={<Sparkles size={20} />}
            iconPosition="start"
            label={`Recommended (${recommendedResearchers.length})`}
          />
        </Tabs>
      </Box>

      {/* Content */}
      {activeTab === 0 && (
        <Box>
          {favoritedResearchers.length === 0 ? (
            <Box
              backgroundColor={colors.primary[400]}
              borderRadius="12px"
              padding="48px"
              textAlign="center"
            >
              <Star size={48} color={colors.grey[500]} style={{ marginBottom: "16px" }} />
              <h3 style={{ color: colors.grey[300], marginBottom: "8px" }}>
                No Favorites Yet
              </h3>
              <p style={{ color: colors.grey[400], marginBottom: "24px" }}>
                Start adding researchers to your favorites to build your network
              </p>
              <button
                onClick={() => navigate('/search')}
                style={{
                  padding: "12px 24px",
                  backgroundColor: colors.greenAccent[600],
                  color: colors.grey[900],
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "all 0.2s",
                }}
              >
                Search Researchers
              </button>
            </Box>
          ) : (
            <Box
              display="grid"
              gridTemplateColumns="repeat(auto-fill, minmax(400px, 1fr))"
              gap="24px"
            >
              {favoritedResearchers.map((researcher) => (
                <ResearcherCard
                  key={researcher.person_id}
                  researcher={researcher}
                  showRemove={true}
                />
              ))}
            </Box>
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Box>
          {recommendedResearchers.length === 0 ? (
            <Box
              backgroundColor={colors.primary[400]}
              borderRadius="12px"
              padding="48px"
              textAlign="center"
            >
              <Sparkles size={48} color={colors.grey[500]} style={{ marginBottom: "16px" }} />
              <h3 style={{ color: colors.grey[300], marginBottom: "8px" }}>
                No Recommendations Available
              </h3>
              <p style={{ color: colors.grey[400], marginBottom: "24px" }}>
                {favoritedResearchers.length === 0
                  ? "Add some favorites first to get personalized recommendations"
                  : "We couldn't find any recommendations based on your favorites"}
              </p>
              {favoritedResearchers.length === 0 && (
                <button
                  onClick={() => navigate('/search')}
                  style={{
                    padding: "12px 24px",
                    backgroundColor: colors.greenAccent[600],
                    color: colors.grey[900],
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600",
                    transition: "all 0.2s",
                  }}
                >
                  Search Researchers
                </button>
              )}
            </Box>
          ) : (
            <Box
              display="grid"
              gridTemplateColumns="repeat(auto-fill, minmax(400px, 1fr))"
              gap="24px"
            >
              {recommendedResearchers.map((researcher) => (
                <ResearcherCard
                  key={researcher.person_id}
                  researcher={researcher}
                  showRemove={false}
                  showAdd={true}
                />
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default Connections;

/*
  author: Lucas Matheson
  edited by: Lucas Matheson
  date: November 27, 2025
  description: Scene for displaying the dashboard with statistics and quick actions
*/
import { useState, useEffect } from "react";
import {
  Box,
  useTheme,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Avatar,
  Chip,
  Divider,
  LinearProgress,
  Paper,
} from "@mui/material";
import {
  Users,
  FolderOpen,
  Building2,
  Heart,
  MapPin,
  Briefcase,
  Search,
  Network,
  ArrowUpRight,
  BookOpen,
  GitBranch,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { getFavorites, removeFavorite } from "../../utils/favoritesManager";


const StatCard = ({ title, value, icon: Icon, color, subtitle, trend, loading }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Card
      sx={{
        backgroundColor: colors.primary[400],
        borderRadius: "16px",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-8px)",
          boxShadow: `0 12px 28px -4px ${color}40`,
        },
      }}
    >
      <CardContent sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box
            sx={{
              backgroundColor: `${color}20`,
              borderRadius: "12px",
              p: 1.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={28} style={{ color: color }} />
          </Box>
          {trend && (
            <Chip
              label={trend}
              size="small"
              sx={{
                backgroundColor: colors.greenAccent[700],
                color: colors.greenAccent[200],
                fontWeight: 600,
                fontSize: "11px",
              }}
            />
          )}
        </Box>
        <Typography
          variant="body2"
          sx={{
            color: colors.grey[300],
            fontSize: "13px",
            fontWeight: 500,
            mb: 1,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {title}
        </Typography>
        {loading ? (
          <Box>
            <CircularProgress size={28} sx={{ color: color }} />
          </Box>
        ) : (
          <>
            <Typography
              variant="h2"
              sx={{
                color: colors.grey[100],
                fontWeight: 700,
                fontSize: "36px",
                mb: 0.5,
                lineHeight: 1,
              }}
            >
              {value?.toLocaleString() || "0"}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: colors.grey[400],
                fontSize: "12px",
                minHeight: "18px",
              }}
            >
              {subtitle || " "}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
};

const ActionCard = ({ title, description, icon: Icon, color, onClick, badge }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Card
      sx={{
        backgroundColor: colors.primary[400],
        borderRadius: "16px",
        cursor: "pointer",
        height: "100%",
        transition: "all 0.3s ease",
        position: "relative",
        overflow: "visible",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 8px 24px -4px ${color}30`,
          "& .arrow-icon": {
            transform: "translate(4px, -4px)",
          },
        },
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box
            sx={{
              backgroundColor: `${color}15`,
              borderRadius: "12px",
              p: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon size={32} style={{ color: color }} />
          </Box>
          <ArrowUpRight
            className="arrow-icon"
            size={20}
            style={{
              color: colors.grey[400],
              transition: "transform 0.3s ease",
            }}
          />
        </Box>
        <Typography
          variant="h5"
          sx={{
            color: colors.grey[100],
            fontWeight: 600,
            mb: 1,
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: colors.grey[400],
            fontSize: "13px",
            lineHeight: 1.6,
          }}
        >
          {description}
        </Typography>
        {badge && (
          <Chip
            label={badge}
            size="small"
            sx={{
              mt: 2,
              backgroundColor: `${color}20`,
              color: color,
              fontWeight: 600,
              fontSize: "11px",
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};

const FavoriteResearcherCard = ({ researcher, colors, onRemove }) => {
  const navigate = useNavigate();

  const handleRemoveFavorite = (e) => {
    e.stopPropagation();
    removeFavorite(researcher.person_id);
    if (onRemove) {
      onRemove(researcher.person_id);
    }
  };

  if (!researcher) {
    return (
      <Card
        sx={{
          backgroundColor: colors.primary[400],
          borderRadius: "16px",
          height: "100%",
          minHeight: "280px",
          display: "flex",
          flexDirection: "column",
          transition: "all 0.3s ease",
          width: '100%',
          "&:hover": {
            backgroundColor: colors.primary[500] ,
          },
        }}
      >
        <CardContent sx={{ textAlign: "center", p: 4, flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <Box
            sx={{
              backgroundColor: `${colors.redAccent[500]}15`,
              borderRadius: "50%",
              width: 80,
              height: 80,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <Heart size={40} style={{ color: colors.redAccent[500] }} />
          </Box>
          <Typography
            variant="h5"
            sx={{ color: colors.grey[200], mb: 1, fontWeight: 600 }}
          >
            No Favorites Yet
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: colors.grey[400], fontSize: "13px", lineHeight: 1.6 }}
          >
            Click the heart icon on researcher profiles to save your favorite
            collaborators here for quick access
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const expertiseList = [
    researcher.expertise_1,
    researcher.expertise_2,
    researcher.expertise_3,
  ].filter(Boolean);

  return (
    <Card
      sx={{
        backgroundColor: colors.primary[400],
        borderRadius: "16px",
        height: "100%",
        cursor: "pointer",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: `0 12px 28px -4px ${colors.redAccent[500]}30`,
        },
      }}
      onClick={() => navigate(`/person/${researcher.person_id}`)}
    >
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar
              sx={{
                bgcolor: colors.greenAccent[600],
                width: 64,
                height: 64,
                fontSize: "1.75rem",
                fontWeight: 700,
                boxShadow: `0 4px 14px ${colors.greenAccent[700]}40`,
              }}
            >
              {researcher.person_name?.charAt(0) || "?"}
            </Avatar>
            <Box>
              <Typography
                variant="h5"
                sx={{ color: colors.grey[100], fontWeight: 600, mb: 0.5 }}
              >
                {researcher.person_name}
              </Typography>
              <Box display="flex" alignItems="center" gap={0.5}>
                <MapPin size={14} style={{ color: colors.grey[400] }} />
                <Typography variant="body2" sx={{ color: colors.grey[400], fontSize: "12px" }}>
                  {researcher.institution_name || "Unknown Institution"}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box
            onClick={handleRemoveFavorite}
            sx={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "transform 0.2s",
              "&:hover": {
                transform: "scale(1.2)",
              },
            }}
          >
            <Heart size={20} style={{ color: colors.redAccent[500], fill: colors.redAccent[500] }} />
          </Box>
        </Box>

        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <Building2 size={14} style={{ color: colors.grey[400] }} />
          <Typography variant="body2" sx={{ color: colors.grey[300], fontSize: "12px" }}>
            {researcher.department_name || "No Department Listed"}
          </Typography>
        </Box>

        <Typography
          variant="body2"
          sx={{
            color: colors.grey[300],
            mb: 2,
            fontSize: "13px",
            lineHeight: 1.6,
            overflow: "hidden",
            textOverflow: "ellipsis",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
          }}
        >
          {researcher.bio || "No bio listed"}
        </Typography>

        {expertiseList.length > 0 && (
          <>
            <Divider sx={{ my: 2, borderColor: colors.primary[300] }} />
            <Box display="flex" flexWrap="wrap" gap={1}>
              {expertiseList.map((exp, idx) => (
                <Chip
                  key={idx}
                  label={exp}
                  size="small"
                  sx={{
                    backgroundColor: colors.blueAccent[700],
                    color: colors.grey[100],
                    fontSize: "11px",
                    fontWeight: 500,
                  }}
                />
              ))}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};


const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalResearchers: 0,
    totalProjects: 0,
    totalInstitutions: 0,
    totalDepartments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [favoriteResearchers, setFavoriteResearchers] = useState([]);
  const [institutionStats, setInstitutionStats] = useState([]);
  const [userName, setUserName] = useState("");
  const [userProfile, setUserProfile] = useState(null);

  const handleRemoveFavorite = (personId) => {
    setFavoriteResearchers(prev => prev.filter(r => r.person_id !== personId));
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch statistics in parallel
        const [peopleRes, projectsRes, institutionsRes] = await Promise.all([
          axios.get("http://127.0.0.1:5001/person/all"),
          axios.get("http://127.0.0.1:5001/project/all"),
          axios.get("http://127.0.0.1:5001/institution/all"),
        ]);

        const peopleData = peopleRes.data?.data || [];
        const projectsData = projectsRes.data?.data || [];
        const institutionsData = institutionsRes.data?.data || [];

        // Calculate unique departments and institutions from people data
        const uniqueDepartments = new Set(
          peopleData
            .map((person) => person.department_name)
            .filter(Boolean)
        ).size;

        // Process institution statistics using people data
        const institutionMap = {};
        
        peopleData.forEach((person) => {
          const instName = person.institution_name;
          
          if (!instName) return; // Skip if no institution
          
          if (!institutionMap[instName]) {
            institutionMap[instName] = {
              id: instName, // Using name as ID since we don't have institution_id in person data
              name: instName,
              researcherCount: 0,
              projectCount: 0,
              departmentCount: 0,
              departments: new Set(),
              researchers: new Set(),
              projects: new Set(),
            };
          }
          
          // Count unique researchers
          institutionMap[instName].researchers.add(person.person_id);
          
          // Count unique departments
          if (person.department_name) {
            institutionMap[instName].departments.add(person.department_name);
          }
        });

        // Count projects per institution by matching researchers
        peopleData.forEach((person) => {
          const instName = person.institution_name;
          if (instName && institutionMap[instName]) {
            // Count their projects
            const personProjects = projectsData.filter(
              (proj) => proj.person_id === person.person_id
            );
            personProjects.forEach((proj) => {
              institutionMap[instName].projects.add(proj.project_id);
            });
          }
        });

        // Convert sets to counts and create final array
        const institutionStatsArray = Object.values(institutionMap).map((inst) => ({
          id: inst.id,
          name: inst.name,
          researcherCount: inst.researchers.size,
          projectCount: inst.projects.size,
          departmentCount: inst.departments.size,
        }));

        // Sort by researcher count
        institutionStatsArray.sort((a, b) => b.researcherCount - a.researcherCount);

        setInstitutionStats(institutionStatsArray);

        setStats({
          totalResearchers: peopleRes.data?.count || 0,
          totalProjects: projectsRes.data?.count || 0,
          totalInstitutions: new Set(
            peopleData.map((person) => person.institution_name).filter(Boolean)
          ).size,
          totalDepartments: uniqueDepartments,
        });

        // Get user info if logged in
        const userEmail = localStorage.getItem("email");
        const personId = localStorage.getItem("person_id");

        if (userEmail) {
          setUserName(userEmail.split("@")[0]);
        }

        // Fetch user profile if available
        if (personId) {
          try {
            const profileRes = await axios.get(`http://127.0.0.1:5001/person/${personId}`);
            setUserProfile(profileRes.data?.data);
          } catch (err) {
            console.log("Could not fetch user profile");
          }
        }

        // Fetch favorite researchers from localStorage
        const favoriteIds = getFavorites();
        if (favoriteIds.length > 0) {
          // Get full researcher data from institutionsData which includes institution and department
          const favoritePeopleMap = {};
          institutionsData.forEach(item => {
            if (favoriteIds.includes(item.person_id) && !favoritePeopleMap[item.person_id]) {
              favoritePeopleMap[item.person_id] = item;
            }
          });
          const favoritePeople = Object.values(favoritePeopleMap);
          setFavoriteResearchers(favoritePeople); // Show all favorites
        } else {
          setFavoriteResearchers([]);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <Box m="20px">
      {/* Header */}
      <Box mb={4}>
        <Header
          title="Dashboard"
          subtitle={
            userProfile
              ? `Welcome back, ${userProfile.person_name}!`
              : userName
              ? `Welcome back, ${userName}!`
              : "Welcome to CollabConnect"
          }
        />

      </Box>

      {/* Main Statistics Grid */}
      <Grid container spacing={3} mb={4} display={'flex'} flexDirection={'row'} gap={'25px'}>
        <Grid item width={'15%'} xs={12} sm={6} lg={3}>
          <StatCard
            title="Total Researchers"
            value={stats.totalResearchers}
            icon={Users}
            color={colors.greenAccent[500]}
            subtitle="Active profiles"
            loading={loading}
          />
        </Grid>
        <Grid item width={'15%'} xs={12} sm={6} lg={3}>
          <StatCard
            title="Research Projects"
            value={stats.totalProjects}
            icon={FolderOpen}
            color={colors.blueAccent[500]}
            subtitle="Published works"
           loading={loading}
          />
        </Grid>
        <Grid item width={'15%'} xs={12} sm={6} lg={3}>
          <StatCard
            title="Institutions"
            value={stats.totalInstitutions}
            icon={Building2}
            color={colors.redAccent[500]}
            subtitle="Partner organizations"
            loading={loading}
          />
        </Grid>
        <Grid width={'15%'} item xs={12} sm={6} lg={3}>
          <StatCard
            title="Departments"
            value={stats.totalDepartments}
            icon={GitBranch}
            color={colors.greenAccent[400]}
            subtitle="Academic units"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Action Cards */}
      <Box mb={4}>
        <Typography
          variant="h4"
          sx={{
            color: colors.grey[100],
            fontWeight: 700,
            mb: 3,
            fontSize: "22px",
          }}
        >
          Quick Actions
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} lg={3}>
            <ActionCard
              title="Find Researchers"
              description="Search through our extensive database of researchers and academics"
              icon={Search}
              color={colors.greenAccent[500]}
              onClick={() => navigate("/search")}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <ActionCard
              title="Browse Projects"
              description="Explore ongoing and completed research projects"
              icon={BookOpen}
              color={colors.blueAccent[500]}
              onClick={() => navigate("/projects")}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <ActionCard
              title="Network Graph"
              description="Visualize collaboration networks and connections"
              icon={Network}
              color={colors.greenAccent[400]}
              onClick={() => navigate("/analytics")}
              badge="Interactive"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <ActionCard
              title="My Profile"
              description="View and manage your professional profile"
              icon={Briefcase}
              color={colors.redAccent[500]}
              onClick={() => {
                const token = localStorage.getItem("access_token");
                const userId = localStorage.getItem("user_id");
                
                // Check if user is logged in
                if (!token || !userId) {
                  navigate("/login");
                  return;
                }
                
                // If logged in, check if they have a profile
                const personId = localStorage.getItem("person_id");
                if (personId) {
                  navigate(`/person/${personId}`);
                } else {
                  navigate(`/user/${userId}`);
                }
              }}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Bottom Section - Side by Side */}
      <Grid width={'100%'} container display={'flex'} flexDirection={'row'} gap={'25px'}>
        {/* Favorite Researchers */}
        <Grid item width={'49%'} xs={12} lg={4}>
          <Paper
            sx={{
              backgroundColor: colors.primary[400],
              borderRadius: "16px",
              p: 3,
              height: "750px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Box
                  sx={{
                    backgroundColor: `${colors.redAccent[500]}15`,
                    borderRadius: "10px",
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Heart size={24} style={{ color: colors.redAccent[500] }} />
                </Box>
                <Typography
                  variant="h4"
                  sx={{
                    color: colors.grey[100],
                    fontWeight: 700,
                    fontSize: "20px",
                  }}
                >
                  Favorite Researchers
                </Typography>
              </Box>
            </Box>
            <Box
              sx={{
                flex: 1,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                pr: 1,
                "&::-webkit-scrollbar": {
                  width: "8px",
                },
                "&::-webkit-scrollbar-track": {
                  backgroundColor: colors.primary[300],
                  borderRadius: "10px",
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: colors.greenAccent[500],
                  borderRadius: "10px",
                  "&:hover": {
                    backgroundColor: colors.greenAccent[400],
                  },
                },
              }}
            >
              {favoriteResearchers.length === 0 ? (
                <FavoriteResearcherCard
                  researcher={null}
                  colors={colors}
                />
              ) : (
                favoriteResearchers.map((researcher) => (
                  <Box key={researcher.person_id}>
                    <FavoriteResearcherCard
                      researcher={researcher}
                      colors={colors}
                      onRemove={handleRemoveFavorite}
                    />
                  </Box>
                ))
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Top Institutions */}
        <Grid item xs={12} lg={8} width={'49%'} >
          <Paper
            sx={{
              backgroundColor: colors.primary[400],
              borderRadius: "16px",
              p: 3,
                height: "750px",
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5} mb={3}>
              <Box
                sx={{
                  backgroundColor: `${colors.greenAccent[500]}15`,
                  borderRadius: "10px",
                  p: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Building2 size={24} style={{ color: colors.greenAccent[500] }} />
              </Box>
              <Typography
                variant="h4"
                sx={{
                  color: colors.grey[100],
                  fontWeight: 700,
                  fontSize: "20px",
                }}
              >
                Top Institutions
              </Typography>
            </Box>
            {loading ? (
              <Box display="flex" justifyContent="center" py={8}>
                <CircularProgress size={40} sx={{ color: colors.greenAccent[500] }} />
              </Box>
            ) : (
              <Box>
                {institutionStats.length > 0 ? (
                  institutionStats.slice(0, 5).map((institution, idx) => {
                    const totalResearchers = stats.totalResearchers || 1;
                    const percentage = Math.round((institution.researcherCount / totalResearchers) * 100);
                    
                    return (
                      <Box key={institution.id} mb={3}>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                          <Box display="flex" alignItems="center" gap={2} flex={1}>
                            <Box
                              sx={{
                                backgroundColor: `${colors.blueAccent[500]}15`,
                                borderRadius: "8px",
                                width: 40,
                                height: 40,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                color: colors.blueAccent[500],
                                fontSize: "18px",
                              }}
                            >
                              #{idx + 1}
                            </Box>
                            <Box flex={1}>
                              <Typography
                                variant="body1"
                                sx={{
                                  color: colors.grey[100],
                                  fontWeight: 600,
                                  fontSize: "15px",
                                  mb: 0.5,
                                }}
                              >
                                {institution.name}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={2}>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <Users size={12} style={{ color: colors.grey[400] }} />
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: colors.grey[400],
                                      fontSize: "11px",
                                    }}
                                  >
                                    {institution.researcherCount} {institution.researcherCount === 1 ? "researcher" : "researchers"}
                                  </Typography>
                                </Box>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <FolderOpen size={12} style={{ color: colors.grey[400] }} />
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: colors.grey[400],
                                      fontSize: "11px",
                                    }}
                                  >
                                    {institution.projectCount} {institution.projectCount === 1 ? "project" : "projects"}
                                  </Typography>
                                </Box>
                                <Box display="flex" alignItems="center" gap={0.5}>
                                  <GitBranch size={12} style={{ color: colors.grey[400] }} />
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: colors.grey[400],
                                      fontSize: "11px",
                                    }}
                                  >
                                    {institution.departmentCount} {institution.departmentCount === 1 ? "dept" : "depts"}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                          <Chip
                            label={`${percentage}%`}
                            size="small"
                            sx={{
                              backgroundColor: colors.greenAccent[700],
                              color: colors.greenAccent[200],
                              fontWeight: 700,
                              fontSize: "11px",
                              minWidth: 50,
                            }}
                          />
                        </Box>
                        <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                          <Typography
                            variant="caption"
                            sx={{
                              color: colors.grey[400],
                              fontSize: "11px",
                            }}
                          >
                            {percentage}% of all researchers
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              color: colors.grey[400],
                              fontSize: "11px",
                              fontWeight: 600,
                            }}
                          >
                            {institution.researcherCount} / {stats.totalResearchers}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: colors.primary[300],
                            "& .MuiLinearProgress-bar": {
                              backgroundColor: colors.greenAccent[500],
                              borderRadius: 4,
                            },
                          }}
                        />
                        {idx < Math.min(institutionStats.length, 5) - 1 && (
                          <Divider sx={{ borderColor: colors.primary[300], mt: 3 }} />
                        )}
                      </Box>
                    );
                  })
                ) : (
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 8,
                    }}
                  >
                    <Box
                      sx={{
                        backgroundColor: `${colors.grey[400]}15`,
                        borderRadius: "50%",
                        width: 80,
                        height: 80,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 20px",
                      }}
                    >
                      <Building2 size={40} style={{ color: colors.grey[400] }} />
                    </Box>
                    <Typography
                      variant="h6"
                      sx={{ color: colors.grey[300], mb: 1, fontWeight: 600 }}
                    >
                      No Data Available
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: colors.grey[400], fontSize: "13px" }}
                    >
                      Institution rankings will appear as data is collected
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;

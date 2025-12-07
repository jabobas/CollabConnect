import React, {
  memo,
  useCallback,
  useMemo,
  useState,
  useEffect,
  useRef,
} from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Avatar,
  Divider,
  CircularProgress,
  Paper,
  IconButton,
  Collapse,
  Stack,
  Button,
  Tab,
  Tabs,
  TextField,
  InputAdornment,
  AvatarGroup,
  Breadcrumbs,
  Link,
} from "@mui/material";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import SearchIcon from "@mui/icons-material/Search";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import SchoolIcon from "@mui/icons-material/School";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTheme } from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import axios from "axios";

const ResearcherCard = memo(({ person, colors }) => {
  const navigate = useNavigate();

  const handleCardClick = useCallback(() => {
    navigate(`/person/${person.person_id}`);
  }, [navigate, person.person_id]);

  const expertiseList = useMemo(
    () =>
      [person.expertise_1, person.expertise_2, person.expertise_3].filter(
        Boolean
      ),
    [person.expertise_1, person.expertise_2, person.expertise_3]
  );

  return (
    <Card
      sx={{
        backgroundColor: colors.primary[400],
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "all 0.3s",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: `0 12px 24px -10px ${colors.greenAccent[700]}`,
          borderColor: colors.greenAccent[500],
          cursor: "pointer",
        },
      }}
      onClick={handleCardClick}
    >
      <CardContent
        sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column" }}
      >
        <Box display="flex" alignItems="flex-start" gap={2} mb={2}>
          <Avatar
            sx={{
              bgcolor: colors.greenAccent[600],
              width: 56,
              height: 56,
              fontSize: "1.5rem",
              fontWeight: 700,
              boxShadow: `0 4px 12px ${colors.greenAccent[700]}50`,
            }}
          >
            {person.person_name?.charAt(0) || "?"}
          </Avatar>

          <Box flex={1} minWidth={0}>
            <Typography
              variant="h6"
              fontWeight="600"
              color={colors.grey[100]}
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                mb: 0.5,
              }}
            >
              {person.person_name}
            </Typography>

            {person.main_field !== "main_field" && (
              <Chip
                label={person.main_field}
                size="small"
                sx={{
                  height: 24,
                  backgroundColor: colors.blueAccent[700],
                  color: colors.grey[100],
                  fontWeight: 500,
                  fontSize: "0.75rem",
                }}
              />
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 1.5, borderColor: colors.primary[300] }} />

        {expertiseList.length > 0 && (
          <Box mb={2}>
            <Typography
              variant="caption"
              color={colors.primary[100]}
              fontWeight={700}
              display="block"
              fontSize={"12px"}
              mb={1}
            >
              Expertise:
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {expertiseList.map((expertise, idx) => (
                <Chip
                  key={idx}
                  label={expertise}
                  size="small"
                  sx={{
                    height: 22,
                    backgroundColor: colors.greenAccent[800],
                    color: colors.grey[100],
                    fontSize: "0.7rem",
                    mb: 0.5,
                  }}
                />
              ))}
            </Stack>
          </Box>
        )}

        <Stack spacing={1} mb={2}>
          {person.person_email && (
            <Box display="flex" alignItems="center" gap={1}>
              <EmailIcon
                sx={{ fontSize: 16, color: colors.greenAccent[400] }}
              />
              <Typography
                variant="caption"
                color={colors.grey[200]}
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontWeight: "bold",
                }}
                fontSize={10}
              >
                {person.person_email}
              </Typography>
            </Box>
          )}
          {person.person_phone && (
            <Box display="flex" alignItems="center" gap={1}>
              <PhoneIcon
                sx={{ fontSize: 16, color: colors.greenAccent[400] }}
              />
              <Typography
                variant="caption"
                fontSize={10}
                color={colors.grey[200]}
                fontWeight={"bold"}
              >
                {person.person_phone}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
});

ResearcherCard.displayName = "ResearcherCard";

// Lazy rendering component that only renders items in batches
const LazyGrid = memo(({ items, colors, batchSize = 12 }) => {
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const observerTarget = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < items.length) {
          setVisibleCount((prev) => Math.min(prev + batchSize, items.length));
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [visibleCount, items.length, batchSize]);

  // Reset visible count when items change
  useEffect(() => {
    setVisibleCount(batchSize);
  }, [items, batchSize]);

  const visibleItems = items.slice(0, visibleCount);

  return (
    <>
      <Grid container spacing={2}>
        {visibleItems.map(([_, person]) => (
          <Grid
            item
            xs={12}
            sm={6}
            lg={4}
            key={person.person_id}
            width={"32.5%"}
            display={"flex"}
            flexDirection={"column"}
          >
            <ResearcherCard person={person} colors={colors} />
          </Grid>
        ))}
      </Grid>
      {visibleCount < items.length && (
        <Box
          ref={observerTarget}
          sx={{ height: 20, mt: 2, textAlign: "center" }}
        >
          <CircularProgress size={24} sx={{ color: colors.greenAccent[500] }} />
        </Box>
      )}
    </>
  );
});

LazyGrid.displayName = "LazyGrid";

const DepartmentSection = memo(
  ({ departmentName, people, colors, searchTerm }) => {
    const [expanded, setExpanded] = useState(false);

    const filteredPeople = useMemo(() => {
      const entries = Object.entries(people);
      if (!searchTerm) return entries;

      const lowerSearch = searchTerm.toLowerCase();
      return entries.filter(
        ([_, person]) =>
          person.person_name?.toLowerCase().includes(lowerSearch) ||
          person.person_email?.toLowerCase().includes(lowerSearch) ||
          person.main_field?.toLowerCase().includes(lowerSearch)
      );
    }, [people, searchTerm]);

    const handleToggle = useCallback(() => {
      setExpanded((prev) => !prev);
    }, []);

    if (filteredPeople.length === 0) return null;

    return (
      <Box mb={3}>
        <Box
          onClick={handleToggle}
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
            cursor: "pointer",
            p: 1.5,
            borderRadius: "8px",
            backgroundColor: colors.primary[600],
            "&:hover": {
              backgroundColor: colors.primary[700],
            },
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <SchoolIcon sx={{ color: colors.greenAccent[400], fontSize: 20 }} />
            <Typography variant="h6" fontWeight="600" color={colors.grey[100]}>
              {departmentName}
            </Typography>
            <Chip
              label={filteredPeople.length + " researchers"}
              size="small"
              sx={{
                height: 22,
                backgroundColor: colors.greenAccent[700],
                color: colors.grey[100],
                fontWeight: 600,
              }}
            />
          </Box>
          <IconButton size="small" sx={{ color: colors.grey[300] }}>
            <ExpandMoreIcon
              sx={{
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.3s",
              }}
            />
          </IconButton>
        </Box>

        <Collapse in={expanded} timeout={300} unmountOnExit>
          <LazyGrid items={filteredPeople} colors={colors} />
        </Collapse>
      </Box>
    );
  }
);

DepartmentSection.displayName = "DepartmentSection";

const Institution = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const { id } = useParams();
  const [institutionData, setInstitution] = useState(null);
  const [institutionName, setInstitutionName] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  useEffect(() => {
    axios
      .get(`http://127.0.0.1:5000/institution/one/${id}`)
      .then((response) => {
        const data = response.data.data;

        const firstDept = Object.values(data)[0];
        const firstPerson = Object.values(firstDept)[0];
        setInstitutionName(
          firstPerson?.institution_name || "Unknown Institution"
        );

        setInstitution(data);
      })
      .catch((err) => {
        console.log(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const stats = useMemo(() => {
    if (!institutionData)
      return { totalResearchers: 0, totalDepartments: 0, largestDept: "N/A" };

    const totalResearchers = Object.values(institutionData).reduce(
      (total, dept) => total + Object.keys(dept).length,
      0
    );
    const totalDepartments = Object.keys(institutionData).length;
    const largestDept =
      Object.entries(institutionData).reduce(
        (max, [dept, people]) =>
          Object.keys(people).length > Object.keys(max[1] || {}).length
            ? [dept, people]
            : max,
        ["", {}]
      )[0] || "N/A";

    return { totalResearchers, totalDepartments, largestDept };
  }, [institutionData]);

  const departmentEntries = useMemo(() => {
    if (!institutionData) return [];
    // Filter out the institution_name key and only keep actual departments
    return Object.entries(institutionData).filter(
      ([key]) => key !== "institution_name"
    );
  }, [institutionData]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
        backgroundColor={colors.primary[500]}
      >
        <CircularProgress size={60} sx={{ color: colors.greenAccent[500] }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        backgroundColor: colors.primary[500],
        minHeight: "100vh",
        pb: 4,
      }}
    >
      <Box m="20px">
        <Box m="20px 20px 0px 20px" sx={{ flexShrink: 0 }}>
          <Header
            title={institutionName}
            subtitle={"Learn more about the " + institutionName}
          />
        </Box>

        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: "7.1rem",
                backgroundColor: colors.primary[400],
                borderRadius: "12px",
                transition: "all 0.3s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: `0 8px 16px ${colors.greenAccent[700]}40`,
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar
                    sx={{
                      bgcolor: colors.greenAccent[700],
                      width: 56,
                      height: 56,
                      boxShadow: `0 4px 12px ${colors.greenAccent[700]}50`,
                    }}
                  >
                    <SchoolIcon sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h3"
                      fontWeight="700"
                      color={colors.grey[100]}
                    >
                      {stats.totalDepartments}
                    </Typography>
                    <Typography
                      variant="body2"
                      color={colors.grey[300]}
                      fontWeight="600"
                    >
                      Departments
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: "7.1rem",
                backgroundColor: colors.primary[400],
                borderRadius: "12px",
                transition: "all 0.3s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: `0 8px 16px ${colors.blueAccent[700]}40`,
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar
                    sx={{
                      bgcolor: colors.blueAccent[700],
                      width: 56,
                      height: 56,
                      boxShadow: `0 4px 12px ${colors.blueAccent[700]}50`,
                    }}
                  >
                    <PeopleIcon sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h3"
                      fontWeight="700"
                      color={colors.grey[100]}
                    >
                      {stats.totalResearchers}
                    </Typography>
                    <Typography
                      variant="body2"
                      color={colors.grey[300]}
                      fontWeight="600"
                    >
                      Researchers
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: "7.1rem",
                backgroundColor: colors.primary[400],
                borderRadius: "12px",
                transition: "all 0.3s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: `0 8px 16px ${colors.greenAccent[700]}40`,
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar
                    sx={{
                      bgcolor: colors.greenAccent[600],
                      width: 56,
                      height: 56,
                      boxShadow: `0 4px 12px ${colors.greenAccent[700]}50`,
                    }}
                  >
                    <BusinessIcon sx={{ fontSize: 28 }} />
                  </Avatar>
                  <Box>
                    <Typography
                      variant="h3"
                      fontWeight="700"
                      color={colors.grey[100]}
                    >
                      82
                    </Typography>
                    <Typography
                      variant="body2"
                      color={colors.grey[300]}
                      fontWeight="600"
                    >
                      Active Projects
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                height: "7.1rem",
                backgroundColor: colors.primary[400],
                borderRadius: "12px",
                transition: "all 0.3s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: `0 8px 16px ${colors.blueAccent[700]}40`,
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <SchoolIcon
                      sx={{ fontSize: 20, color: colors.blueAccent[400] }}
                    />
                    <Typography
                      variant="body2"
                      color={colors.grey[300]}
                      fontWeight="600"
                    >
                      Largest Department
                    </Typography>
                  </Box>
                  <Typography
                    variant="h5"
                    fontWeight="700"
                    color={colors.grey[100]}
                    sx={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {stats.largestDept}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box>
          {departmentEntries.map(([departmentName, people]) => (
            <DepartmentSection
              key={departmentName}
              departmentName={departmentName}
              people={people}
              colors={colors}
              searchTerm={searchTerm}
            />
          ))}

          {departmentEntries.length === 0 && (
            <Paper
              sx={{
                p: 6,
                textAlign: "center",
                backgroundColor: colors.primary[400],
              }}
            >
              {loading ? (
                <CircularProgress
                  size={60}
                  sx={{ color: colors.greenAccent[500] }}
                />
              ) : (
                <Typography variant="h5" color={colors.grey[300]}>
                  No researchers found
                </Typography>
              )}
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Institution;

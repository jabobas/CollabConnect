/*
  author: Lucas Matheson
  edited by: Lucas Matheson
  date: November 20th, 2025
  description: Topbar component for navigation within the CollabConnect application.
*/
import { 
  Box, 
  IconButton, 
  useTheme, 
  Button, 
  Breadcrumbs, 
  Link, 
  Typography,
  Menu,
  MenuItem,
  Badge,
  Divider,
  ListItemIcon,
  ListItemText
} from "@mui/material";
import { useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ColorModeContext, tokens } from "../../theme";
import axios from "axios";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import HomeIcon from "@mui/icons-material/Home";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

const Topbar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [notifications, setNotifications] = useState([
    // Placeholder notifications - these will be replaced with real data later
    // { id: 1, message: 'New collaboration request from Dr. Smith', type: 'info', timestamp: new Date() },
    // { id: 2, message: 'Your project "AI Research" has been updated', type: 'success', timestamp: new Date() },
  ]);

  const handleNotificationClick = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleMarkAllRead = () => {
    // In the future, this will mark all notifications as read
    setNotifications([]);
    handleNotificationClose();
  };

  const unreadCount = notifications.length;

  // Generate breadcrumbs based on current path
  useEffect(() => {
    const generateBreadcrumbs = async () => {
      const pathSegments = location.pathname.split('/').filter(segment => segment);
      const crumbs = [{ label: 'Home', path: '/', icon: <HomeIcon sx={{ fontSize: '1rem', mr: 0.5 }} /> }];

      // Route name mappings
      const routeNames = {
        'search': 'Search Collaborators',
        'projects': 'Search Projects',
        'connections': 'Manage Connections',
        'analytics': 'Network Visualization',
        'data-collection': 'Data Collection',
        'faq': 'FAQ',
        'settings': 'Settings',
        'login': 'Login',
        'register': 'Register',
        'create-profile': 'Create Profile',
        'claim-profile': 'Claim Profile',
      };

      for (let i = 0; i < pathSegments.length; i++) {
        const segment = pathSegments[i];
        const path = '/' + pathSegments.slice(0, i + 1).join('/');
        
        // Check if segment is a static route name
        if (routeNames[segment]) {
          crumbs.push({ label: routeNames[segment], path });
        } 
        // Handle dynamic routes (person, project, institution, etc.)
        else if (i > 0 && !isNaN(segment)) {
          const previousSegment = pathSegments[i - 1];
          
          try {
            if (previousSegment === 'person') {
              const response = await axios.get(`http://127.0.0.1:5001/person/${segment}`);
              const personName = response.data.data?.person?.person_name || `Person ${segment}`;
              crumbs.push({ label: personName, path });
            } else if (previousSegment === 'project') {
              const response = await axios.get(`http://127.0.0.1:5001/project/${segment}`);
              const projectTitle = response.data.data?.project_title || response.data.data?.title || `Project ${segment}`;
              crumbs.push({ label: projectTitle, path });
            } else if (previousSegment === 'institution') {
              const response = await axios.get(`http://127.0.0.1:5001/institution/one/${segment}`);
              const data = response.data.data;
              const firstDept = Object.values(data)[0];
              const firstPerson = Object.values(firstDept)[0];
              const institutionName = firstPerson?.institution_name || `Institution ${segment}`;
              crumbs.push({ label: institutionName, path });
            } else if (previousSegment === 'department') {
              const response = await axios.get(`http://127.0.0.1:5001/department/${segment}`);
              const departmentName = response.data.data?.department_name || `Department ${segment}`;
              crumbs.push({ label: departmentName, path });
            } else if (previousSegment === 'user') {
              crumbs.push({ label: 'My Profile', path });
            } else {
              crumbs.push({ label: segment, path });
            }
          } catch (error) {
            console.error(`Failed to fetch data for ${previousSegment}:`, error);
            crumbs.push({ label: `${previousSegment.charAt(0).toUpperCase() + previousSegment.slice(1)} ${segment}`, path });
          }
        } else if (segment === 'person' || segment === 'project' || segment === 'institution' || segment === 'department' || segment === 'user') {
          // Skip these, they'll be handled with the ID
          continue;
        } else {
          // Capitalize and add unknown segments
          crumbs.push({ label: segment.charAt(0).toUpperCase() + segment.slice(1), path });
        }
      }

      setBreadcrumbs(crumbs);
    };

    generateBreadcrumbs();
  }, [location.pathname]);

  // Check if user is logged in - runs on mount and whenever storage changes
  useEffect(() => {
    const checkAuth = () => {
      const storedUserId = localStorage.getItem('user_id');
      if (storedUserId) {
        setIsLoggedIn(true);
        setUserId(storedUserId);
      } else {
        setIsLoggedIn(false);
        setUserId(null);
      }
    };

    checkAuth();

    // Listen for storage changes (login/logout in other tabs)
    window.addEventListener('storage', checkAuth);
    
    window.addEventListener('authChange', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('authChange', checkAuth);
    };
  }, []);

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('person_id');
    delete axios.defaults.headers.common['Authorization'];
    setIsLoggedIn(false);
    setUserId(null);
    navigate('/');
  };

  const handleProfileClick = () => {
    if (userId) {
      navigate(`/user/${userId}`);
    }
  };

  return (
  <Box display="flex" justifyContent="space-between" alignItems="center" p="1.25rem">
      {/* BREADCRUMB NAVIGATION */}
      <Box
        display="flex"
        alignItems="center"
        backgroundColor={colors.primary[400]}
        borderRadius="0.5rem"
        padding="0.5rem 1rem"
        sx={{
          minWidth: 'fit-content',
          maxWidth: '70%',
          overflow: 'hidden',
        }}
      >
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" sx={{ color: colors.grey[400] }} />}
          aria-label="breadcrumb"
          sx={{
            '& .MuiBreadcrumbs-ol': {
              flexWrap: 'nowrap',
            },
            '& .MuiBreadcrumbs-li': {
              display: 'flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
            }
          }}
        >
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            return isLast ? (
              <Typography
                key={crumb.path}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  color: colors.greenAccent[500],
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  maxWidth: '400px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {crumb.icon}
                {crumb.label}
              </Typography>
            ) : (
              <Link
                key={crumb.path}
                underline="hover"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  color: colors.grey[300],
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                  maxWidth: '300px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  '&:hover': {
                    color: colors.greenAccent[400],
                  },
                }}
                onClick={() => navigate(crumb.path)}
              >
                {crumb.icon}
                {crumb.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      </Box>
      {/* ICONS */}
    <Box display="flex" alignItems="center" gap="0.625rem"> {/* gap="10px" -> gap="0.625rem" */}
      <IconButton onClick={colorMode.toggleColorMode}>
        {theme.palette.mode === "dark" ? (
          <DarkModeOutlinedIcon />
        ) : (
          <LightModeOutlinedIcon />
        )}
      </IconButton>
        <IconButton onClick={handleNotificationClick}>
          <Badge badgeContent={unreadCount} color="error">
            <NotificationsOutlinedIcon />
          </Badge>
        </IconButton>
        <Menu
          anchorEl={notificationAnchor}
          open={Boolean(notificationAnchor)}
          onClose={handleNotificationClose}
          PaperProps={{
            sx: {
              backgroundColor: colors.primary[400],
              minWidth: '350px',
              maxWidth: '400px',
              maxHeight: '500px',
              mt: 1,
              borderRadius: '8px',
              boxShadow: `0 8px 24px ${colors.primary[900]}80`,
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ p: 2, pb: 1 }}>
            <Typography variant="h6" sx={{ color: colors.grey[100], fontWeight: 600 }}>
              Notifications
            </Typography>
          </Box>
          <Divider sx={{ borderColor: colors.primary[300] }} />
          
          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <InfoOutlinedIcon sx={{ fontSize: 48, color: colors.grey[400], mb: 1 }} />
              <Typography variant="body2" sx={{ color: colors.grey[300] }}>
                No new notifications
              </Typography>
              <Typography variant="caption" sx={{ color: colors.grey[400], display: 'block', mt: 0.5 }}>
                You're all caught up!
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ maxHeight: '350px', overflowY: 'auto' }}>
                {notifications.map((notification) => (
                  <MenuItem
                    key={notification.id}
                    onClick={handleNotificationClose}
                    sx={{
                      px: 2,
                      py: 1.5,
                      borderBottom: `1px solid ${colors.primary[300]}`,
                      '&:hover': {
                        backgroundColor: colors.primary[300],
                      },
                    }}
                  >
                    <ListItemIcon>
                      {notification.type === 'success' ? (
                        <CheckCircleOutlineIcon sx={{ color: colors.greenAccent[500] }} />
                      ) : (
                        <InfoOutlinedIcon sx={{ color: colors.blueAccent[500] }} />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={notification.message}
                      secondary={notification.timestamp.toLocaleString()}
                      primaryTypographyProps={{
                        sx: { color: colors.grey[100], fontSize: '0.875rem' }
                      }}
                      secondaryTypographyProps={{
                        sx: { color: colors.grey[400], fontSize: '0.75rem' }
                      }}
                    />
                  </MenuItem>
                ))}
              </Box>
              <Divider sx={{ borderColor: colors.primary[300] }} />
              <Box sx={{ p: 1, textAlign: 'center' }}>
                <Button
                  size="small"
                  onClick={handleMarkAllRead}
                  sx={{
                    color: colors.greenAccent[500],
                    '&:hover': {
                      backgroundColor: colors.primary[300],
                    }
                  }}
                >
                  Mark all as read
                </Button>
              </Box>
            </>
          )}
        </Menu>
<IconButton onClick={() => navigate('/settings')}>
  <SettingsOutlinedIcon />
</IconButton>


        {isLoggedIn ? (
          <>
            <IconButton onClick={handleProfileClick} title="My Profile">
              <PersonOutlinedIcon />
            </IconButton>
            <Button
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{
                color: colors.grey[100],
                borderColor: colors.grey[300],
                '&:hover': {
                  borderColor: colors.redAccent[500],
                  backgroundColor: colors.redAccent[800],
                }
              }}
            >
              Logout
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outlined"
              startIcon={<LoginIcon />}
              onClick={() => navigate('/login')}
              sx={{
                color: colors.grey[100],
                borderColor: colors.grey[300],
                '&:hover': {
                  borderColor: colors.greenAccent[500],
                  backgroundColor: colors.greenAccent[800],
                }
              }}
            >
              Login
            </Button>
            <Button
              variant="contained"
              onClick={() => navigate('/register')}
              sx={{
                backgroundColor: colors.greenAccent[600],
                color: colors.grey[100],
                '&:hover': {
                  backgroundColor: colors.greenAccent[700],
                }
              }}
            >
              Sign Up
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Topbar;
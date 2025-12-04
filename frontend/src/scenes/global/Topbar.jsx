/*
Top navigation bar with search, theme toggle, notifications, settings, and
user profile/login/logout buttons.
*/

import { Box, IconButton, useTheme, Button } from "@mui/material";
import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ColorModeContext, tokens } from "../../theme";
import InputBase from "@mui/material/InputBase";
import axios from "axios";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import SearchIcon from "@mui/icons-material/Search";

const Topbar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);

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
    <Box display="flex" justifyContent="space-between" p={2}>
      {/* SEARCH BAR */}
      <Box
        display="flex"
        backgroundColor={colors.primary[400]}
        borderRadius="3px"
      >
        <InputBase sx={{ ml: 2, flex: 1 }} placeholder="Search" />
        <IconButton type="button" sx={{ p: 1 }}>
          <SearchIcon />
        </IconButton>
      </Box>

      {/* ICONS */}
      <Box display="flex" alignItems="center" gap="10px">
        <IconButton onClick={colorMode.toggleColorMode}>
          {theme.palette.mode === "dark" ? (
            <DarkModeOutlinedIcon />
          ) : (
            <LightModeOutlinedIcon />
          )}
        </IconButton>
        <IconButton>
          <NotificationsOutlinedIcon />
        </IconButton>
        <IconButton>
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
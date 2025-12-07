// Settings.jsx
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails, useTheme, Switch, FormControlLabel, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { tokens, getAvailableColorSchemes } from "../../theme";
import Header from "../../components/Header";
import { useContext, useState } from "react";
import { ColorModeContext } from "../../theme";

const Settings = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  
  // Get all available color schemes dynamically
  const availableSchemes = getAvailableColorSchemes();
  
  // State for settings
  const [defaultMode, setDefaultMode] = useState(
    localStorage.getItem('defaultColorMode') || 'dark'
  );
  const [colorScheme, setColorScheme] = useState(
    localStorage.getItem('colorScheme') || 'default'
  );

  // Save default mode to localStorage
  const handleDefaultModeChange = (event) => {
    const newMode = event.target.checked ? 'dark' : 'light';
    setDefaultMode(newMode);
    localStorage.setItem('defaultColorMode', newMode);
  };

  // Save color scheme to localStorage and reload
  const handleColorSchemeChange = (event) => {
    const newScheme = event.target.value;
    setColorScheme(newScheme);
    localStorage.setItem('colorScheme', newScheme);
    window.location.reload();
  };

  return (
    <Box m="20px">
      <Header title="Settings" subtitle="Customize CollabConnect" />
      
      <Box mt="20px">
        {/* Appearance Settings */}
        <Accordion defaultExpanded sx={{ backgroundColor: colors.primary[400] }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography color={colors.grey[100]} variant="h5">
              Appearance
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flexDirection="column" gap="20px">
              {/* Current Color Mode Toggle */}
              <Box>
                <Typography variant="h6" color={colors.grey[100]} mb="10px">
                  Current Color Mode
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={theme.palette.mode === 'dark'}
                      onChange={colorMode.toggleColorMode}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: colors.greenAccent[500],
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: colors.greenAccent[500],
                        },
                      }}
                    />
                  }
                  label={
                    <Typography color={colors.grey[100]}>
                      {theme.palette.mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </Typography>
                  }
                />
              </Box>

              {/* Default Color Mode */}
              <Box>
                <Typography variant="h6" color={colors.grey[100]} mb="10px">
                  Default Color Mode (On Startup)
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={defaultMode === 'dark'}
                      onChange={handleDefaultModeChange}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: colors.blueAccent[500],
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: colors.blueAccent[500],
                        },
                      }}
                    />
                  }
                  label={
                    <Typography color={colors.grey[100]}>
                      Default to {defaultMode === 'dark' ? 'Dark' : 'Light'} Mode
                    </Typography>
                  }
                />
                <Typography variant="body2" color={colors.grey[300]} mt="5px">
                  This will be the color mode when you first load the app
                </Typography>
              </Box>

              {/* Color Scheme Selection - Dynamically Generated */}
              <Box>
                <Typography variant="h6" color={colors.grey[100]} mb="10px">
                  Color Scheme
                </Typography>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: colors.grey[100] }}>Theme</InputLabel>
                  <Select
                    value={colorScheme}
                    onChange={handleColorSchemeChange}
                    label="Theme"
                    sx={{
                      backgroundColor: colors.primary[400],
                      color: colors.grey[100],
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.grey[300],
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.grey[100],
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.greenAccent[500],
                      },
                    }}
                  >
                    {availableSchemes.map((scheme) => (
                      <MenuItem key={scheme.id} value={scheme.id}>
                        {scheme.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="body2" color={colors.grey[300]} mt="5px">
                  Page will reload to apply the new color scheme
                </Typography>
              </Box>

              {/* Color Preview */}
              <Box>
                <Typography variant="h6" color={colors.grey[100]} mb="10px">
                  Current Theme Preview
                </Typography>
                <Box display="flex" gap="10px" flexWrap="wrap">
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      backgroundColor: colors.primary[500],
                      borderRadius: "4px",
                      border: `2px solid ${colors.grey[300]}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="caption" color={colors.grey[100]}>
                      Primary
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      backgroundColor: colors.greenAccent[500],
                      borderRadius: "4px",
                      border: `2px solid ${colors.grey[300]}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="caption" color="#ffffff">
                      Green
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      backgroundColor: colors.redAccent[500],
                      borderRadius: "4px",
                      border: `2px solid ${colors.grey[300]}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="caption" color="#ffffff">
                      Red
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      backgroundColor: colors.blueAccent[500],
                      borderRadius: "4px",
                      border: `2px solid ${colors.grey[300]}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="caption" color="#ffffff">
                      Blue
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Notifications - Placeholder */}
        <Accordion sx={{ backgroundColor: colors.primary[400], mt: "10px" }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography color={colors.grey[100]} variant="h5">
              Notifications
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography color={colors.grey[300]}>
              Notification settings coming soon...
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* Privacy & Security - Placeholder */}
        <Accordion sx={{ backgroundColor: colors.primary[400], mt: "10px" }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography color={colors.grey[100]} variant="h5">
              Privacy & Security
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography color={colors.grey[300]}>
              Privacy and security settings coming soon...
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* Language & Region - Placeholder */}
        <Accordion sx={{ backgroundColor: colors.primary[400], mt: "10px" }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography color={colors.grey[100]} variant="h5">
              Language & Region
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography color={colors.grey[300]}>
              Language and region settings coming soon...
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* Account - Placeholder */}
        <Accordion sx={{ backgroundColor: colors.primary[400], mt: "10px" }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography color={colors.grey[100]} variant="h5">
              Account
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography color={colors.grey[300]}>
              Account settings coming soon...
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Box>
  );
};

export default Settings;
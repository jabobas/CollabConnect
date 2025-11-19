import { useState } from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { Link } from "react-router-dom";
import "react-pro-sidebar/dist/css/styles.css";
import { tokens } from "../../theme";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import { Users } from "lucide-react";
import PersonSearchIcon from '@mui/icons-material/PersonSearch';

const Item = ({ title, to, icon, selected, setSelected }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <MenuItem
      active={selected === title}
      style={{
        color: colors.grey[100],
      }}
      onClick={() => setSelected(title)}
      icon={icon}
    >
      <Typography>{title}</Typography>
      <Link to={to} />
    </MenuItem>
  );
};

const Sidebar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selected, setSelected] = useState("Dashboard");

  return (
    <Box
      sx={{
        "& .pro-sidebar-inner": {
          background: `${colors.primary[400]} !important`,
        },
        "& .pro-icon-wrapper": {
          backgroundColor: "transparent !important",
        },
        "& .pro-inner-item": {
          padding: "5px 20px 5px 20px !important",
        },
        "& .pro-inner-item:hover": {
          color: "#868dfb !important",
        },
        "& .pro-menu-item.active": {
          color: "#6870fa !important",
        },
      }}
    >
      <ProSidebar collapsed={isCollapsed}>
        <Menu iconShape="square">
          {/* LOGO AND MENU ICON */}
          <MenuItem
            onClick={() => setIsCollapsed(!isCollapsed)}
            icon={isCollapsed ? <MenuOutlinedIcon /> : undefined}
            style={{
              margin: "10px 0 20px 0",
              color: colors.grey[100],
            }}
          >
            {!isCollapsed && (
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                gap="10px"
              >
                {/* <img
                  alt="CollabConnect logo"
                  src={logo}
                  style={{ maxHeight: "55px", maxWidth: "170px" }}
                /> */}

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}
                >
                  <Users
                    style={{
                      width: "32px",
                      height: "32px",
                      color: colors.blueAccent[500],
                    }}
                  />
                  <div>
                    <h2
                      style={{
                        color: colors.grey[100],
                        fontSize: "20px",
                        fontWeight: "bold",
                        margin: 0,
                      }}
                    >
                      CollabConnect
                    </h2>
                    <p
                      style={{
                        color: colors.grey[300],
                        fontSize: "12px",
                        margin: 0,
                      }}
                    >
                      Discover Excellence
                    </p>
                  </div>
                </div>
                <IconButton onClick={() => setIsCollapsed(!isCollapsed)}>
                  <MenuOutlinedIcon />
                </IconButton>
              </Box>
            )}
          </MenuItem>
          {/* If wee want a profile pic and name for a user, this will add it to the sidebar  */}
          {/*           
           {!isCollapsed && (
            <Box mb="25px">
              <Box display="flex" justifyContent="center" alignItems="center">
                <img
                  alt="profile-user"
                  width="100px"
                  height="100px"
                  src={`../../assets/user.png`}
                  style={{ cursor: "pointer", borderRadius: "50%" }}
                />
              </Box>
              <Box textAlign="center">
                <Typography
                  variant="h2"
                  color={colors.grey[100]}
                  fontWeight="bold"
                  sx={{ m: "10px 0 0 0" }}
                >
                  Lucas. M
                </Typography>
                <Typography variant="h5" color={colors.greenAccent[500]}>
                  COS Student
                </Typography>
              </Box>
            </Box>
          )} */}

          {/* DEFINE YOUR ROUTE PUSHES HERE  */}
          <Box paddingLeft={isCollapsed ? undefined : "10%"}>
            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              Home
            </Typography>
            <Item
              title="Dashboard"
              to="/"
              icon={<HomeOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            {/* ToDo: This align needs to be fixed, the margin works when expanded but when the sidebar
                Is collapsed it appears off center */}
            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              Connect
            </Typography>

            <Item
              title="Manage Connections"
              to="/connections"
              icon={<PeopleOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            <Item
              title="Search Collaberators"
              to="/search"
              icon={<PersonSearchIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Typography
              variant="h6"
              color={colors.grey[300]}
              sx={{ m: "15px 0 5px 20px" }}
            >
              Data
            </Typography>

            <Item
              title="Data Collection"
              to="/data-collection"
              icon={<CalendarTodayOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            <Item
              title="FAQ Page"
              to="/faq"
              icon={<HelpOutlineOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
            <Item
              title="Data Request"
              to="/data-request"
              icon={<PersonOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
          </Box>
        </Menu>
      </ProSidebar>
    </Box>
  );
};

export default Sidebar;

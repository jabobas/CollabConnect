import { ColorModeContext, useMode } from "./theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { Route, Routes } from "react-router-dom";
import Topbar from "./scenes/global/Topbar";
import Dashboard from "./scenes/dashboard";
import Sidebar from "./scenes/global/Sidebar";

import SearchCollab from "./scenes/SearchCollab";
import Person from "./scenes/person";
import Department from "./scenes/department";
import Login from "./scenes/login";
import Register from "./scenes/register";
import User from "./scenes/user";
import CreateProfile from "./scenes/create-profile";
import ClaimProfile from "./scenes/claim-profile";
// import Institution from "./scenes/Institution";

function App() {
  const [theme, colorMode] = useMode();
  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="app">
          <Sidebar/>
          <main className="content">
            <Topbar />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              {/* <Route path="/connections" element={ }/> */}
              <Route path="/search" element={<SearchCollab />} />

              <Route path="/person/:id" element={<Person />} />
              {/* <Route path="/institution/:id" element={<Institution />} /> */}
              <Route path="/department/:id" element={<Department />} />
              
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/user/:id" element={<User />} />
              <Route path="/create-profile" element={<CreateProfile />} />
              <Route path="/people" element={<ClaimProfile />} />

              {/* <Route path="/data-collection" element={< />} /> */}
              {/* <Route path="/faq" element={< />} /> */}
              {/* <Route path="/data-request element={< />} /> */}
            </Routes>
          </main>
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
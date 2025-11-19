import { ColorModeContext, useMode } from "./theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { Route, Routes } from "react-router-dom";
import LegacyTopbar from "./scenes/global/LegacyTopbar";
import Dashboard from "./scenes/dashboard";
import LegacySidebar from "./scenes/global/LegacySidebar";
import Team from "./scenes/team";
// import Invoices from "./scenes/invoices";
// import Bar from "./scenes/bar";
// import Form from "./scenes/form";
// import Line from "./scenes/line";
// import Pie from "./scenes/pie";
// import FAQ from "./scenes/faq";
// import Geography from "./scenes/geography";
import SearchCollab from "./scenes/SearchCollab"

function App() {
  const [theme, colorMode] = useMode();
  return (
    // Since this is a context, .provider is used to wrap all the child components, then supply the value
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        {/* On theme change, CssBaseLine resets css values to default */}
        <CssBaseline />
        <div className="app">
          <LegacySidebar/>
          <main className="content">
            <LegacyTopbar />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              {/* <Route path="/connections" element={ }/> */}
              <Route path="/search" element={<SearchCollab />} />
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

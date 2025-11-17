import { ColorModeContext, useMode } from "./theme";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { Route, Routes } from "react-router-dom";
import Topbar from "./scenes/global/Topbar";
import Dashboard from "./scenes/dashboard";
import Sidebar from "./scenes/global/Sidebar";
import Team from "./scenes/team";
// import Invoices from "./scenes/invoices";
// import Bar from "./scenes/bar";
// import Form from "./scenes/form";
// import Line from "./scenes/line";
// import Pie from "./scenes/pie";
// import FAQ from "./scenes/faq";
// import Geography from "./scenes/geography";
import Contacts from "./scenes/contacts"

function App() {
  const [theme, colorMode] = useMode();
  return (
    // Since this is a context, .provider is used to wrap all the child components, then supply the value
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        {/* On theme change, CssBaseLine resets css values to default */}
        <CssBaseline />
        <div className="app">
          <Sidebar/>
          <main className="content">
            <Topbar />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/team" element={<Team />} />
              <Route path="/connections" element={<Contacts />}/>
              {/* <Route path="/search" element={<Leetcode />} /> */}
              {/* <Route path="/invoices" element={<Invoices />} /> */}
              {/* <Route path="/form" element={<Form />} /> */}
              {/* <Route path="/bar" element={<Bar />} /> */}
              {/* <Route path="/pie" element={<Pie />} /> */}
              {/* <Route path="/line" element={<Line />} /> */}
              {/* <Route path="/faq" element={<FAQ />} /> */}
              {/* <Route path="/geography" element={<Geography />} /> */}
              {/* <Route path="/calendar" element={<Calendar/>}/> */}
            </Routes>
          </main>
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;

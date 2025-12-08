/*
  author: Lucas Matheson
  edited by: Lucas Matheson
  date: November 20th, 2025
  description: Theme configuration and color schemes for the CollabConnect application.
*/
import { createContext, useState, useMemo, useEffect } from "react";
import { createTheme } from "@mui/material/styles";

// Get the selected color scheme from localStorage
const getColorScheme = () => {
  return localStorage.getItem('colorScheme') || 'default';
};

// Export function to get all available color schemes with their display names
export const getAvailableColorSchemes = () => {
  return Object.keys(colorSchemes).map(schemeId => ({
    id: schemeId,
    name: schemeId.charAt(0).toUpperCase() + schemeId.slice(1).replace(/([A-Z])/g, ' $1').trim()
  }));
};

// Color scheme definitions
const colorSchemes = {
  default: {
    grey: {
      100: "#e0e0e0",
      200: "#c2c2c2",
      300: "#a3a3a3",
      400: "#858585",
      500: "#666666",
      600: "#525252",
      700: "#3d3d3d",
      800: "#292929",
      900: "#141414",
    },
    primary: {
      100: "#d0d1d5",
      200: "#a1a4ab",
      300: "#727681",
      400: "#1F2A40",
      500: "#141b2d",
      600: "#101624",
      700: "#0c101b",
      800: "#080b12",
      900: "#040509",
    },
    greenAccent: {
      100: "#dbf5ee",
      200: "#b7ebde",
      300: "#94e2cd",
      400: "#70d8bd",
      500: "#4cceac",
      600: "#3da58a",
      700: "#2e7c67",
      800: "#1e5245",
      900: "#0f2922",
    },
    redAccent: {
      100: "#f8dcdb",
      200: "#f1b9b7",
      300: "#e99592",
      400: "#e2726e",
      500: "#db4f4a",
      600: "#af3f3b",
      700: "#832f2c",
      800: "#58201e",
      900: "#2c100f",
    },
    blueAccent: {
      100: "#e1e2fe",
      200: "#c3c6fd",
      300: "#a4a9fc",
      400: "#868dfb",
      500: "#6870fa",
      600: "#535ac8",
      700: "#3e4396",
      800: "#2a2d64",
      900: "#151632",
    },
  },
  ocean: {
    grey: {
      100: "#e0e0e0",
      200: "#c2c2c2",
      300: "#a3a3a3",
      400: "#858585",
      500: "#666666",
      600: "#525252",
      700: "#3d3d3d",
      800: "#292929",
      900: "#141414",
    },
    primary: {
      100: "#cce7f5",
      200: "#99cfeb",
      300: "#66b7e1",
      400: "#1a4d6d",
      500: "#0d3952",
      600: "#0a2e42",
      700: "#082331",
      800: "#051721",
      900: "#030c10",
    },
    greenAccent: {
      100: "#ccf5f0",
      200: "#99ebe1",
      300: "#66e1d2",
      400: "#33d7c3",
      500: "#00cdb4",
      600: "#00a490",
      700: "#007b6c",
      800: "#005248",
      900: "#002924",
    },
    redAccent: {
      100: "#ffd9d9",
      200: "#ffb3b3",
      300: "#ff8c8c",
      400: "#ff6666",
      500: "#ff4040",
      600: "#cc3333",
      700: "#992626",
      800: "#661a1a",
      900: "#330d0d",
    },
    blueAccent: {
      100: "#d4e3f7",
      200: "#a9c7ef",
      300: "#7eabe7",
      400: "#538fdf",
      500: "#2873d7",
      600: "#205cac",
      700: "#184581",
      800: "#102e56",
      900: "#08172b",
    },
  },
  // Slate Gray (Modern / Sophisticated)
  slateGray: {
    grey: {
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
    },
    primary: {
      100: "#e2e8f0",
      200: "#cbd5e1",
      300: "#94a3b8",
      400: "#475569",
      500: "#1e293b",
      600: "#172032",
      700: "#0f172a",
      800: "#0a0f1e",
      900: "#050712",
    },
    greenAccent: {
      100: "#dcfce7",
      200: "#bbf7d0",
      300: "#86efac",
      400: "#4ade80",
      500: "#22c55e",
      600: "#16a34a",
      700: "#15803d",
      800: "#166534",
      900: "#14532d",
    },
    redAccent: {
      100: "#fee2e2",
      200: "#fecaca",
      300: "#fca5a5",
      400: "#f87171",
      500: "#ef4444",
      600: "#dc2626",
      700: "#b91c1c",
      800: "#991b1b",
      900: "#7f1d1d",
    },
    blueAccent: {
      100: "#dbeafe",
      200: "#bfdbfe",
      300: "#93c5fd",
      400: "#60a5fa",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
      800: "#1e40af",
      900: "#1e3a8a",
    },
  },
  // Charcoal (Minimal / Clean)
  charcoal: {
    grey: {
      100: "#fafafa",
      200: "#f4f4f5",
      300: "#e4e4e7",
      400: "#a1a1aa",
      500: "#71717a",
      600: "#52525b",
      700: "#3f3f46",
      800: "#27272a",
      900: "#18181b",
    },
    primary: {
      100: "#f4f4f5",
      200: "#e4e4e7",
      300: "#d4d4d8",
      400: "#3f3f46",
      500: "#27272a",
      600: "#1f1f22",
      700: "#18181b",
      800: "#121214",
      900: "#0a0a0b",
    },
    greenAccent: {
      100: "#d9f99d",
      200: "#bef264",
      300: "#a3e635",
      400: "#84cc16",
      500: "#65a30d",
      600: "#4d7c0f",
      700: "#3f6212",
      800: "#365314",
      900: "#1a2e05",
    },
    redAccent: {
      100: "#fecaca",
      200: "#fca5a5",
      300: "#f87171",
      400: "#ef4444",
      500: "#b91c1c",
      600: "#991b1b",
      700: "#7f1d1d",
      800: "#5f1010",
      900: "#3f0808",
    },
    blueAccent: {
      100: "#bfdbfe",
      200: "#93c5fd",
      300: "#60a5fa",
      400: "#3b82f6",
      500: "#1d4ed8",
      600: "#1e40af",
      700: "#1e3a8a",
      800: "#172554",
      900: "#0f1a3d",
    },
  },
};

export const tokens = (mode) => {
  const scheme = getColorScheme();
  const colors = colorSchemes[scheme] || colorSchemes.default;
  
  if (mode === "dark") {
    return {
      grey: colors.grey,
      primary: colors.primary,
      greenAccent: colors.greenAccent,
      redAccent: colors.redAccent,
      blueAccent: colors.blueAccent,
    };
  } else {
    // Invert colors for light mode
    return {
      grey: {
        100: colors.grey[900],
        200: colors.grey[800],
        300: colors.grey[700],
        400: colors.grey[600],
        500: colors.grey[500],
        600: colors.grey[400],
        700: colors.grey[300],
        800: colors.grey[200],
        900: colors.grey[100],
      },
      primary: {
        100: colors.primary[900],
        200: colors.primary[800],
        300: colors.primary[700],
        400: "#f2f0f0",
        500: "#ffffff",
        600: colors.primary[300],
        700: colors.primary[200],
        800: colors.primary[100],
        900: colors.primary[100],
      },
      greenAccent: {
        100: colors.greenAccent[900],
        200: colors.greenAccent[800],
        300: colors.greenAccent[700],
        400: colors.greenAccent[600],
        500: colors.greenAccent[500],
        600: colors.greenAccent[400],
        700: colors.greenAccent[300],
        800: colors.greenAccent[200],
        900: colors.greenAccent[100],
      },
      redAccent: {
        100: colors.redAccent[900],
        200: colors.redAccent[800],
        300: colors.redAccent[700],
        400: colors.redAccent[600],
        500: colors.redAccent[500],
        600: colors.redAccent[400],
        700: colors.redAccent[300],
        800: colors.redAccent[200],
        900: colors.redAccent[100],
      },
      blueAccent: {
        100: colors.blueAccent[900],
        200: colors.blueAccent[800],
        300: colors.blueAccent[700],
        400: colors.blueAccent[600],
        500: colors.blueAccent[500],
        600: colors.blueAccent[400],
        700: colors.blueAccent[300],
        800: colors.blueAccent[200],
        900: colors.blueAccent[100],
      },
    };
  }
};

// mui theme settings
export const themeSettings = (mode) => {
  const colors = tokens(mode);

  return {
    palette: {
      mode: mode,
      ...(mode === "dark"
        ? {
            primary: {
              main: colors.primary[500],
            },
            secondary: {
              main: colors.greenAccent[500],
            },
            neutral: {
              dark: colors.grey[700],
              main: colors.grey[500],
              light: colors.grey[100],
            },
            background: {
              default: colors.primary[500],
            },
          }
        : {
            primary: {
              main: colors.primary[100],
            },
            secondary: {
              main: colors.greenAccent[500],
            },
            neutral: {
              dark: colors.grey[700],
              main: colors.grey[500],
              light: colors.grey[100],
            },
            background: {
              default: "#fcfcfc",
            },
          }),
    },
    spacing: 8, // Base spacing unit (in pixels)
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 960,
        lg: 1280,
        xl: 1920,
        xxl: 2560, // Add custom breakpoint
      },
    },
    typography: {
      fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
      fontSize: 12,
      h1: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: "2.5rem", // 40px at base size
      },
      h2: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: "2rem", // 32px at base size
      },
      h3: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: "1.5rem", // 24px at base size
      },
      h4: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: "1.25rem", // 20px at base size
      },
      h5: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: "1rem", // 16px at base size
      },
      h6: {
        fontFamily: ["Source Sans Pro", "sans-serif"].join(","),
        fontSize: "0.875rem", // 14px at base size
      },
    },
  };
};

// context for color mode
export const ColorModeContext = createContext({
  toggleColorMode: () => {},
});

export const useMode = () => {
  // Get default mode from localStorage or default to "dark"
  const getDefaultMode = () => {
    return localStorage.getItem('defaultColorMode') || 'dark';
  };

  const [mode, setMode] = useState(getDefaultMode());

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () =>
        setMode((prev) => (prev === "light" ? "dark" : "light")),
    }),
    []
  );

  // using mui, this will create the theme of the mode.
  const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);

  return [theme, colorMode];
};
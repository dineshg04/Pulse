import { createTheme } from "@mui/material/styles";

const getTheme = (mode: "light" | "dark") =>
  createTheme({
    palette: {
      mode,

      primary: {
        main: "#6366F1",
      },

      secondary: {
        main: "#64748B",
      },

      background:
        mode === "light"
          ? {
              default: "#F8FAFC",
              paper: "#FFFFFF",
            }
          : {
              default: "#0F172A",
              paper: "#1E293B",
            },

      text:
        mode === "light"
          ? {
              primary: "#1E293B",
              secondary: "#64748B",
            }
          : {
              primary: "#F1F5F9",
              secondary: "#94A3B8",
            },

      error: {
        main: "#EF4444",
      },

      success: {
        main: "#22C55E",
      },

      warning: {
        main: "#F59E0B",
      },
    },

    typography: {
      fontFamily: '"Inter", "Roboto", "Arial", sans-serif',

      h1: {
        fontSize: "2rem",
        fontWeight: 700,
      },

      h2: {
        fontSize: "1.5rem",
        fontWeight: 600,
      },

      h3: {
        fontSize: "1.25rem",
        fontWeight: 600,
      },

      body1: {
        fontSize: "0.95rem",
      },

      body2: {
        fontSize: "0.875rem",
      },
    },

    shape: {
      borderRadius: 8,
    },

    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 600,
            borderRadius: 8,
          },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            border: `1px solid ${
              mode === "light" ? "#E2E8F0" : "#334155"
            }`,
            boxShadow: "none",
          },
        },
      },
    },
  });

export default getTheme;
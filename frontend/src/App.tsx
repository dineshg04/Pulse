import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import AppLayout from "./components/layouts/AppLayout";

import { Typography } from "@mui/material";

function DashboardPlaceholder() {
  return (
    <Typography variant="h4" sx={{ fontWeight: 700 }}>
      Welcome to Pulse Dashboard
    </Typography>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <AppLayout>
              <DashboardPlaceholder />
            </AppLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import AppHeader from "src/components/AppHeader";
import AddCandidateButton from "src/components/candidates/AddCandidateButton";
import SideNav, { DRAWER_WIDTH } from "src/components/SideNav";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const showAddButton = location.pathname.startsWith("/hr/candidates");

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#0f1b2a", color: "#e7ecf3" }}>
      <SideNav />
      <AppHeader drawerWidth={DRAWER_WIDTH} />
      <Toolbar sx={{ minHeight: 56 }} />

      {showAddButton && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ml: 2 }}>
          <AddCandidateButton />
        </Box>
      )}

      <Box
        component="main"
        sx={{
          ml: `${DRAWER_WIDTH}px`,
          py: 2,
          width: `calc(100vw - ${DRAWER_WIDTH}px)`,
        }}
      >
        <Container
          maxWidth={false}
          disableGutters
          sx={{
            px: { xs: 2, md: 3, xl: 4 },
            py: 0,
            minWidth: 0,
          }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
}
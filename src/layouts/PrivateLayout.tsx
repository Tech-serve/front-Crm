import { Tooltip } from "@mui/material";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import type { ReactNode } from "react";
import AppHeader from "src/components/AppHeader";
import AddCandidateButton from "src/components/candidates/AddCandidateButton";
import SideNav, { DRAWER_WIDTH } from "src/components/SideNav";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#0f1b2a",
        color: "#e7ecf3",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <SideNav />
      <AppHeader drawerWidth={DRAWER_WIDTH} />

      <Toolbar sx={{ minHeight: 56, flexShrink: 0 }} />

      <Box
        component="main"
        sx={{
          ml: { xs: 0, md: `${DRAWER_WIDTH}px` },       
          pt: { xs: 0, md: 2 },                          
          pb: { xs: 2, md: 2 },
          pr: { xs: 0, md: 2 },                           
          pl: { xs: 0, md: 2 },                      
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          minHeight: 0,
        }}
      >
        <Container
          maxWidth={false}
          disableGutters                                
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            px: { xs: 0, sm: 2 },                        
          }}
        >
          {children}
        </Container>
      </Box>
    </Box>
  );
}
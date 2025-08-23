import { styled, useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import Paper from "@mui/material/Paper";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import useMediaQuery from "@mui/material/useMediaQuery";
import { NavLink, Link as RouterLink, useLocation, useNavigate } from "react-router-dom";

import DashboardRoundedIcon   from "@mui/icons-material/DashboardRounded";
import PeopleRoundedIcon      from "@mui/icons-material/PeopleRounded";
import ListAltRoundedIcon     from "@mui/icons-material/ListAltRounded";
import ChecklistRoundedIcon   from "@mui/icons-material/ChecklistRounded";

import logoUrl from "src/assets/logo.png";

export const DRAWER_WIDTH = 88;

const ui = {
  railBg: "#1f334b",
  railBorder: "rgba(255,255,255,0.08)",
  text: "#e9f0fb",
  textMuted: "rgba(233,240,251,0.8)",
  hoverBg: "rgba(255,255,255,0.10)",
  activeBg: "#27496f",
  activeText: "#ffffff",
  hoverShadow: "0 6px 14px rgba(10, 24, 43, 0.32)",
  ripple: "rgba(200, 215, 235, 0.4)",
};

const Rail = styled(Box)({
  position: "fixed",
  top: 0,
  left: 0,
  width: DRAWER_WIDTH,
  height: "100vh",
  background: ui.railBg,
  color: ui.text,
  borderRight: `1px solid ${ui.railBorder}`,
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
});

const LogoLink = styled(RouterLink)({
  height: 65,
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderBottom: `1px solid ${ui.railBorder}`,
  padding: "0 8px",
  textDecoration: "none",
  lineHeight: 0,
  "& img": {
    height: 28,
    maxWidth: "80%",
    objectFit: "contain",
    display: "block",
    filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.25))",
  },
});

const ItemButton = styled(ListItemButton)({
  justifyContent: "center",
  borderRadius: 14,
  margin: "8px 10px",
  paddingTop: 10,
  paddingBottom: 10,
  color: ui.text,
  transition:
    "box-shadow .18s ease, background-color .18s ease, transform .06s ease",
  overflow: "hidden",
  "&:hover": { background: ui.hoverBg, boxShadow: ui.hoverShadow },
  "&:active": { transform: "translateY(0.5px)" },
  "&& .MuiTouchRipple-root .MuiTouchRipple-child": { backgroundColor: ui.ripple },
  "&.active": {
    background: ui.activeBg,
    color: ui.activeText,
    boxShadow:
      "0 8px 20px rgba(15, 35, 64, 0.45), inset 0 0 0 1px rgba(255,255,255,0.05)",
  },
});

const ItemIcon = styled(ListItemIcon)({ minWidth: 0, color: "inherit" });

const Label = styled(ListItemText)({
  marginTop: 4,
  textAlign: "center",
  "& .MuiListItemText-primary": { fontSize: 11, color: "inherit", opacity: 0.95 },
});

function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const ITEMS = [
    { to: "/",                 icon: <DashboardRoundedIcon />,  label: "Process"    },
    { to: "/hr/candidates",    icon: <PeopleRoundedIcon />,     label: "Candidates" },
    { to: "/hr/employeesPage", icon: <ListAltRoundedIcon />,    label: "Employees"  },
    { to: "/hr/checklist",     icon: <ChecklistRoundedIcon/>,   label: "Checklist"  },
  ];

  const value = (() => {
    let bestIdx = 0;
    let bestLen = -1;
    ITEMS.forEach((it, idx) => {
      if (location.pathname === it.to || location.pathname.startsWith(it.to)) {
        if (it.to.length > bestLen) {
          bestIdx = idx;
          bestLen = it.to.length;
        }
      }
    });
    return bestIdx;
  })();

  return (
    <>
      <Paper
        elevation={10}
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: (t) => t.zIndex.appBar + 1, 
        }}
      >
        <BottomNavigation
          showLabels={false}                 
          value={value}
          onChange={(_, newValue) => navigate(ITEMS[newValue].to)}
          sx={{
            bgcolor: "#0f1b2a",
            "& .MuiBottomNavigationAction-root": {
              color: "rgba(255,255,255,0.7)",
              minWidth: 0,
            },
            "& .Mui-selected, & .Mui-selected .MuiSvgIcon-root": {
              color: "primary.main",
            },
          }}
        >
          {ITEMS.map((it) => (
            <BottomNavigationAction key={it.to} icon={it.icon} />
          ))}
        </BottomNavigation>
      </Paper>

      <Box sx={{ height: 64, display: { xs: "block", md: "none" } }} />
    </>
  );
}

export default function SideNav() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (isMobile) {
    return <MobileBottomNav />;
  }

  const items = [
    { to: "/",                 icon: <DashboardRoundedIcon />, label: "Process"    },
    { to: "/hr/candidates",    icon: <PeopleRoundedIcon />,    label: "Candidates" },
    { to: "/hr/employeesPage", icon: <ListAltRoundedIcon />,   label: "Employees"  },
    { to: "/hr/checklist",     icon: <ChecklistRoundedIcon/>,  label: "Checklist"  },
  ];

  return (
    <Rail>
      <LogoLink to="/">
        <img src={logoUrl} alt="CRM" />
      </LogoLink>

      <List sx={{ mt: 1 }}>
        {items.map((it) => (
          <Tooltip key={it.to} title={it.label} placement="right" arrow>
            <NavLink to={it.to} end style={{ textDecoration: "none" }}>
              {({ isActive }) => (
                <ItemButton
                  className={isActive ? "active" : undefined}
                  sx={{ flexDirection: "column" }}
                  disableRipple={false}
                  TouchRippleProps={{ center: true }}
                >
                  <ItemIcon>{it.icon}</ItemIcon>
                  <Label primary={it.label} />
                </ItemButton>
              )}
            </NavLink>
          </Tooltip>
        ))}
      </List>
    </Rail>
  );
}
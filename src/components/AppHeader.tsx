import { styled } from "@mui/material/styles";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Badge from "@mui/material/Badge";
import InputBase from "@mui/material/InputBase";
import Tooltip from "@mui/material/Tooltip";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

import ProfileMenu from "./ProfileMenu";
import { useAppDispatch, useAppSelector } from "src/store/store";
import { logout } from "src/features/auth/authSlice";

type Props = { drawerWidth: number };

const HeaderBar = styled(AppBar)<{ drawerwidth: number }>(({ theme, drawerwidth }) => ({
  backgroundColor: "#1f334b",
  color: "#fff",
  zIndex: theme.zIndex.drawer + 1,
  boxShadow: "none",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  width: `calc(100% - ${drawerwidth}px)`,
  marginLeft: drawerwidth,
  [theme.breakpoints.down("md")]: {
    width: "100%",
    marginLeft: 0,
  },
}));

const SearchWrap = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: 8,
  background: "rgba(255,255,255,0.12)",
  padding: "6px 10px",
  borderRadius: 24,
  minWidth: 280,
  transition: "background .2s ease",
  "&:focus-within": { background: "rgba(255,255,255,0.18)" },
  [theme.breakpoints.down("sm")]: {
    minWidth: 0,
    width: "100%",
  },
}));

const SearchInput = styled(InputBase)({
  color: "#fff",
  width: "100%",
  "& input::placeholder": { color: "rgba(255,255,255,.8)" },
});

export default function AppHeader({ drawerWidth }: Props) {
  const user = useAppSelector((s) => s.auth.user);
  const dispatch = useAppDispatch();

  return (
    <HeaderBar position="fixed" drawerwidth={drawerWidth}>
      <Toolbar sx={{ minHeight: 56, px: { xs: 1, sm: 2 } }}>
        <Typography
          variant="h6"
          sx={{ fontWeight: 700, mr: { xs: 1, sm: 3 } }}
        >
          CRM
        </Typography>

        <Box sx={{ flex: 1, minWidth: 0, maxWidth: { xs: "100%", sm: 720 } }}>
          <SearchWrap>
            <SearchRoundedIcon fontSize="small" />
            <SearchInput placeholder="Поиск (Ctrl + K)" />
          </SearchWrap>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1.5 }, ml: { xs: 1, sm: 2 } }}>
          <Tooltip title="Создать">
            <IconButton
              size="small"
              sx={{ bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}
            >
              <AddRoundedIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Уведомления">
            <IconButton size="small" sx={{ color: "#fff" }}>
              <Badge color="success" variant="dot" overlap="circular">
                <NotificationsRoundedIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <Tooltip title="Настройки">
            <IconButton size="small" sx={{ color: "#fff" }}>
              <SettingsRoundedIcon />
            </IconButton>
          </Tooltip>

          <ProfileMenu
            email={user?.email}
            onLogout={() => dispatch(logout())}
          />
        </Box>
      </Toolbar>
    </HeaderBar>
  );
}
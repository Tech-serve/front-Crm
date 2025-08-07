import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { styled } from "@mui/material/styles";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import type { SxProps, Theme } from "@mui/material/styles";
import { PROFILE_MENU } from "src/config/profileMenu";

type Props = {
  email?: string;
  onLogout: () => void;
  tooltip?: string;
  avatarSx?: SxProps<Theme>;
};

const ProfileButton = styled(IconButton)({
  padding: 2,
  borderRadius: "50%",
  border: "2px solid transparent",
  transition: "border-color .15s ease, box-shadow .15s ease",
  "&:hover": {
    borderColor: "rgba(46, 204, 113, 0.85)",
    boxShadow: "0 0 0 4px rgba(46, 204, 113, 0.18)",
  },
});

export default function ProfileMenu({ email, onLogout, tooltip = "Профиль", avatarSx }: Props) {
  const initials = useMemo(() => {
    if (!email) return "U";
    const name = email.split("@")[0];
    const parts = name.replace(/[._-]+/g, " ").trim().split(" ");
    const inits = parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
    return inits || "U";
  }, [email]);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <Tooltip title={tooltip}>
        <ProfileButton size="small" onClick={handleOpen}>
          <Avatar
            sx={{
              width: 30,
              height: 30,
              fontSize: 14,
              bgcolor: "#2ecc71",
              ...avatarSx,
            }}
          >
            {initials}
          </Avatar>
        </ProfileButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 200,
              bgcolor: "#1f334b",
              color: "#e9f0fb",
              border: "1px solid rgba(255,255,255,0.12)",
            },
          },
        }}
      >
        {PROFILE_MENU.map((item, idx) => {
          const beforeDivider = idx === 0 && PROFILE_MENU.length > 1;

          if (item.type === "link") {
            return (
              <MenuItem
                key={item.id}
                component={RouterLink}
                to={item.to}
                onClick={handleClose}
                sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.08)" } }}
              >
                <ListItemIcon sx={{ color: "inherit" }}>
                  <PersonOutlineRoundedIcon fontSize="small" />
                </ListItemIcon>
                {item.label}
              </MenuItem>
            );
          }

          return (
            <span key={item.id}>
              {beforeDivider && <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />}
              <MenuItem
                onClick={() => {
                  handleClose();
                  onLogout();
                }}
                sx={{ "&:hover": { bgcolor: "rgba(255,255,255,0.08)" } }}
              >
                <ListItemIcon sx={{ color: "inherit" }}>
                  <LogoutRoundedIcon fontSize="small" />
                </ListItemIcon>
                {item.label}
              </MenuItem>
            </span>
          );
        })}
      </Menu>
    </>
  );
}
import { useMemo, useState } from "react";
import { styled } from "@mui/material/styles";
import Chip from "@mui/material/Chip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import type { InterviewStatus } from "src/types/domain";

export type StatusOption = {
  value: InterviewStatus;
  label: string;
  dot: string;
  bg: string;
  fg: string;
};

export type StatusSelectProps = {
  value: InterviewStatus;
  options?: StatusOption[];
  disabled?: boolean;
  size?: "small" | "medium";
  onChange?: (next: InterviewStatus) => void;          
  onSave?: (next: InterviewStatus) => Promise<unknown>; 
  optimistic?: boolean;                                
};

const THIRD_STATUS = "failed" as InterviewStatus; 

const DEFAULTS: { value: InterviewStatus; label: string; dot: string; bg: string; fg: string; }[] = [
  { value: "not_held", label: "В процессе", dot: "#5b8def", bg: "rgba(91,141,239,0.12)", fg: "#bbd0ff" },
  { value: "success",  label: "Принято",    dot: "#2ecc71", bg: "rgba(46,204,113,0.12)", fg: "#bff0cf" },
  { value: THIRD_STATUS, label: "Отказано", dot: "#ff5252", bg: "rgba(255,82,82,0.12)",  fg: "#ff8a8a" },
];

const Dot = styled("span")<{ color: string }>(({ color }) => ({
  width: 10,
  height: 10,
  borderRadius: "50%",
  backgroundColor: color,
  display: "inline-block",
}));

export default function StatusSelect({
  value,
  options,
  disabled,
  size = "small",
  onChange,
  onSave,
  optimistic = true,
}: StatusSelectProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [saving, setSaving] = useState(false);

  const list = options?.length ? options : DEFAULTS;
  const current = useMemo(
    () => list.find(o => o.value === value) ?? list[0],
    [list, value]
  );

  const openMenu = (e: React.MouseEvent<HTMLElement>) => {
    if (disabled || saving) return;
    setAnchorEl(e.currentTarget);
  };
  const closeMenu = () => setAnchorEl(null);

  const handlePick = async (next: InterviewStatus) => {
    if (next === value) return closeMenu();

    let rollback: (() => void) | null = null;
    if (optimistic && onChange) {
      const prev = value;
      onChange(next);
      rollback = () => onChange(prev);
    }

    if (onSave) {
      try {
        setSaving(true);
        await onSave(next);
      } catch {
        if (rollback) rollback();
      } finally {
        setSaving(false);
      }
    } else if (!optimistic && onChange) {
      onChange(next);
    }

    closeMenu();
  };

  return (
    <>
      <Chip
        size={size}
        clickable
        disabled={disabled || saving}
        onClick={openMenu}
        label={
          <Box display="inline-flex" alignItems="center" gap={0.8}>
            <Dot color={current.dot} />
            {current.label}
            {saving && <CircularProgress size={12} sx={{ ml: 0.5 }} />}
          </Box>
        }
        sx={{
          bgcolor: current.bg,
          color: current.fg,
          border: "1px solid rgba(255,255,255,0.08)",
          fontWeight: 600,
          "&:hover": { opacity: 0.95 },
        }}
      />

      <Menu
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        {list.map(opt => (
          <MenuItem
            key={opt.value}
            selected={opt.value === current.value}
            onClick={() => handlePick(opt.value)}
          >
            <ListItemIcon sx={{ minWidth: 24 }}>
              <Dot color={opt.dot} />
            </ListItemIcon>
            <ListItemText primary={opt.label} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
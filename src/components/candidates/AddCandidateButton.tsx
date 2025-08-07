import { useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CandidateDialog from "./CandidateDialog";

export default function AddCandidateButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Tooltip title="Добавить кандидата">
        <IconButton
          color="inherit"
          onClick={() => setOpen(true)}
          sx={{ bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}
        >
          <AddRoundedIcon />
        </IconButton>
      </Tooltip>
      <CandidateDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
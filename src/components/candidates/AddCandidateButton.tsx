import { useState } from "react";
import { Fab, Tooltip, Zoom } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CandidateDialog from "./CandidateDialog";

export default function AddCandidateButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title="Добавить кандидата" placement="left">
        <Zoom in>
          <Fab
            color="primary"
            aria-label="Добавить кандидата"
            onClick={() => setOpen(true)}
            sx={{
              position: "fixed",
              right: { xs: 16, sm: 24, md: 32 },
              bottom: { xs: 16, sm: 24, md: 32 },
              width: 68,
              height: 68,
              zIndex: (t) => t.zIndex.drawer + 1,
              boxShadow: 6,
            }}
          >
            <AddRoundedIcon sx={{ fontSize: 34 }} />
          </Fab>
        </Zoom>
      </Tooltip>

      <CandidateDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
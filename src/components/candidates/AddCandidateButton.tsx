import { useState } from "react";
import { Tooltip, Zoom, Button } from "@mui/material";
import { keyframes } from "@mui/system";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CandidateDialog from "./CandidateDialog";

const ripple = keyframes`
  0%   { transform: scale(0.2); opacity: .45; }
  100% { transform: scale(2.8); opacity: 0; }
`;

export default function AddCandidateButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title="Добавить кандидата" placement="left">
        <Zoom in>
          <Button
            aria-label="Добавить кандидата"
            onClick={() => setOpen(true)}
            sx={{
              position: "fixed",
              bottom: 100,
              right: 50,
              width: 60,
              height: 60,
              minWidth: 0,
              p: 0,
              borderRadius: "50%",
              zIndex: (t) => t.zIndex.drawer + 1,
              boxShadow: 6,
              color: "#fff",
              bgcolor: "rgba(33, 150, 243, 0.65)", // полупрозрачный синий
              border: "1px solid rgba(255,255,255,0.28)",
              backdropFilter: "blur(6px)",
              transition: "background-color .2s ease, box-shadow .2s ease, transform .1s ease",
              "&:hover": {
                bgcolor: "rgba(33, 150, 243, 0.85)",
                boxShadow: 10,
              },
              "&:active": {
                transform: "translateY(1px)",
              },
              "&::after": {
                content: '""',
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                pointerEvents: "none",
              },
              "&:active::after": {
                animation: `${ripple} .6s ease-out`,
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 60%)",
              },
            }}
          >
            <AddRoundedIcon sx={{ fontSize: 34 }} />
          </Button>
        </Zoom>
      </Tooltip>

      <CandidateDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
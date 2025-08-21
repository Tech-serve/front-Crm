import { useMemo } from "react";
import { Box, MenuItem, Select, styled } from "@mui/material";
import { POSITION_OPTIONS } from "src/config/positionConfig";
import { usePatchCandidateMutation } from "src/api/candidatesApi";
import { usePatchEmployeeMutation } from "src/api/employeesApi";

type Props = {
  row: any;
  value?: string | null;
  widthPx?: number;
  patchKind?: "candidate" | "employee";
};

const WIDTH = 160;

const CompactSelect = styled(Select)(({ theme }) => ({
  "& .MuiSelect-select": {
    padding: "6px 10px",
    minHeight: 32,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  },
  "& .MuiOutlinedInput-notchedOutline": { borderRadius: theme.shape.borderRadius },
}));

export default function PositionCell({ row, value, widthPx, patchKind = "candidate" }: Props) {
  const [patchCandidate] = usePatchCandidateMutation();
  const [patchEmployee] = usePatchEmployeeMutation();

  const dept = row?.department as keyof typeof POSITION_OPTIONS;
  const options = POSITION_OPTIONS[dept] || [];
  const current = useMemo(() => value ?? row?.position ?? "", [value, row?.position]);

  const handle = async (next: string) => {
    if (patchKind === "employee") {
      await patchEmployee({ id: row._id, body: { position: next || null } }).unwrap();
    } else {
      await patchCandidate({ id: row._id, body: { position: next || "" } }).unwrap();
    }
  };

  return (
    <Box sx={{ display: "inline-flex" }}>
      <CompactSelect
        size="small"
        value={current}
        onChange={(e) => handle(e.target.value as string)}
        displayEmpty
        sx={{ width: widthPx ?? WIDTH }}
        MenuProps={{ PaperProps: { sx: { mt: 0.5 } } }}
      >
        <MenuItem value="">
          <em>—</em>
        </MenuItem>
        {options.map((o) => (
          <MenuItem key={o.value} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </CompactSelect>
    </Box>
  );
}
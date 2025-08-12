import { useMemo } from "react";
import { Box, MenuItem, Select, styled } from "@mui/material";
import { DEPARTMENTS } from "src/config/departmentConfig";
import { usePatchCandidateMutation } from "src/api/candidatesApi";
import type { Candidate, DepartmentValue } from "src/types/domain";

type Props = {
  row: Candidate;
  value?: DepartmentValue;
  widthPx?: number;
};

const WIDTH = 170;

const CompactSelect = styled(Select)(({ theme }) => ({
  "& .MuiSelect-select": {
    padding: "6px 10px",
    minHeight: 32,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    boxSizing: "border-box",
    whiteSpace: "nowrap",       
    overflow: "hidden",         
    textOverflow: "ellipsis",  
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderRadius: theme.shape.borderRadius,
  },
}));

const Dot = ({ color }: { color: string }) => (
  <span
    style={{
      display: "inline-block",
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: color,
    }}
  />
);

export default function DepartmentCell({ row, value, widthPx }: Props) {
  const [patchCandidate] = usePatchCandidateMutation();

  const current = useMemo(() => {
    const v = value ?? row.department ?? DEPARTMENTS[0].value;
    return DEPARTMENTS.find((d) => d.value === v) || DEPARTMENTS[0];
  }, [value, row.department]);

  const handle = async (next: DepartmentValue) => {
    await patchCandidate({ id: row._id, body: { department: next } }).unwrap();
  };

  return (
    <Box sx={{ display: "inline-flex" }}>
      <CompactSelect
        size="small"
        value={current.value}
        onChange={(e) => handle(e.target.value as DepartmentValue)}
        sx={{
          width: widthPx ?? WIDTH,
          bgcolor: current.bg,
          color: current.fg,
          "& .MuiSvgIcon-root": { color: current.fg },
        }}
        MenuProps={{ PaperProps: { sx: { mt: 0.5 } } }}
      >
        {DEPARTMENTS.map((d) => (
          <MenuItem key={d.value} value={d.value}>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
              <Dot color={d.dot} />
              {d.label}
            </Box>
          </MenuItem>
        ))}
      </CompactSelect>
    </Box>
  );
}
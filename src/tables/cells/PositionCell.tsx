import { useMemo } from "react";
import { Box, MenuItem, Select, styled } from "@mui/material";
import { POSITION_OPTIONS } from "src/config/positionConfig";
import { DEPARTMENTS } from "src/config/departmentConfig";
import { usePatchCandidateMutation } from "src/api/candidatesApi";
import type { Candidate, PositionValue } from "src/types/domain";

type Props = {
  row: Candidate;
  value?: PositionValue;
};

const WIDTH = 140;

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

export default function PositionCell({ row, value }: Props) {
  const [patchCandidate] = usePatchCandidateMutation();

  const options = useMemo(
    () => POSITION_OPTIONS[row.department || ""] || [],
    [row.department]
  );
  const disabled = options.length === 0;

  // цвета берём ровно как в DepartmentCell
  const dep = useMemo(() => {
    const v = (row.department as any) ?? DEPARTMENTS[0].value;
    return DEPARTMENTS.find((d) => d.value === v) || DEPARTMENTS[0];
  }, [row.department]);

  return (
    <Box sx={{ display: "inline-flex" }}>
      <CompactSelect
        size="small"
        value={value || ""}
        onChange={(e) => {
          const position = e.target.value as PositionValue;
          patchCandidate({ id: row._id, body: { position } });
        }}
        displayEmpty
        renderValue={(selected) => (selected ? (selected as string) : "—")}
        sx={{
          width: WIDTH,
          bgcolor: dep.bg,
          color: dep.fg,
          "& .MuiSvgIcon-root": { color: dep.fg },
        }}
        MenuProps={{ PaperProps: { sx: { mt: 0.5 } } }}
        disabled={disabled}
      >
        <MenuItem value="">
          <em>—</em>
        </MenuItem>

        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </CompactSelect>
    </Box>
  );
}
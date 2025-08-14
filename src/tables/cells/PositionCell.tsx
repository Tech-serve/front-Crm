import { Box, MenuItem, Select, styled } from "@mui/material";
import { POSITION_OPTIONS } from "src/config/positionConfig";
import { usePatchCandidateMutation } from "src/api/candidatesApi";
import type { Candidate, PositionValue } from "src/types/domain";

type Props = {
  row: Candidate;
  value?: PositionValue;
};

const CellSelect = styled(Select)({
  height: 32,
  minHeight: 32,
  "& .MuiSelect-select": {
    display: "flex",
    alignItems: "center",
    padding: "6px 10px",
    minHeight: 0,
    lineHeight: "20px",
    fontSize: 13,
  },
  "& .MuiOutlinedInput-notchedOutline": {
    border: "1px dashed rgba(255,255,255,0.25)",
  },
});

export default function PositionCell({ row, value }: Props) {
  const [patchCandidate] = usePatchCandidateMutation();
  const options = POSITION_OPTIONS[row.department || ""] || [];
  const disabled = options.length === 0;

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        alignItems: "center",
      }}
    >
      <CellSelect
        size="small"
        value={value || ""}
        onChange={(e) => {
          const position = e.target.value as PositionValue;
          patchCandidate({ id: row._id, body: { position } });
        }}
        displayEmpty
        renderValue={(selected) => (selected ? (selected as string) : "—")}
        sx={{ width: 180 }}
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
      </CellSelect>
    </Box>
  );
}
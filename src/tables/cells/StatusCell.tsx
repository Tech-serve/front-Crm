import { useMemo } from "react";
import { Box, MenuItem, Select, styled } from "@mui/material";
import type { Candidate, InterviewStatus } from "src/types/domain";
import type { StatusOption } from "src/config/statusConfig";
import { usePatchCandidateMutation } from "src/api/candidatesApi";

/* --------- props --------------------------------------------- */
type Props = {
  row:       Candidate;
  value?:    InterviewStatus;           // если DataGrid передаёт вычисленное поле
  options:   StatusOption[];
  onChange?: (next: InterviewStatus, row: Candidate) => void;
  widthPx?:  number;                    // ширина селекта, по-умолчанию 160
};

const STATUS_WIDTH_DEFAULT = 160;

/* --------- ui helpers ---------------------------------------- */
const CompactSelect = styled(Select)(({ theme }) => ({
  minWidth: 0,
  "& .MuiSelect-select": {
    padding: "6px 10px",
    minHeight: 32,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    borderRadius: theme.shape.borderRadius,
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderRadius: theme.shape.borderRadius,
  },
}));

function Dot({ color }: { color: string }) {
  return (
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
}

/* --------- component ---------------------------------------- */
export default function StatusCell({
  row,
  value,
  options,
  onChange,
  widthPx,
}: Props) {
  /* статус берём либо из value, либо из «свежего» интервью */
  const current = useMemo(() => {
    const currentValue =
      value ??
      row.interviews?.[0]?.status ??        // последний интервью-запись
      "not_held";
    return options.find((o) => o.value === currentValue) ?? options[0];
  }, [options, value, row.interviews]);

  const [patchCandidate] = usePatchCandidateMutation();

  const handleChange = async (next: InterviewStatus) => {
    if (onChange) {
      onChange(next, row);
      return;
    }

    /* обновляем статус самого первого интервью в массиве */
    const updatedInterviews =
      row.interviews && row.interviews.length
        ? [{ ...row.interviews[0], status: next }, ...row.interviews.slice(1)]
        : [{ status: next, scheduledAt: new Date().toISOString() } as any];

    await patchCandidate({
      id: row._id,
      body: { interviews: updatedInterviews },
    }).unwrap();
  };

  const width = widthPx ?? STATUS_WIDTH_DEFAULT;

  /* --------- render ----------------------------------------- */
  return (
    <Box sx={{ display: "inline-flex" }}>
      <CompactSelect
        size="small"
        value={current.value}
        onChange={(e) => handleChange(e.target.value as InterviewStatus)}
        sx={{
          width,
          bgcolor: current.bg,
          color: current.fg,
          "& .MuiSvgIcon-root": { color: current.fg },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(0,0,0,0.12)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(0,0,0,0.18)",
            borderWidth: 1,
          },
          "& .MuiSelect-select": {
            width,
            boxSizing: "border-box",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          },
        }}
        MenuProps={{ PaperProps: { sx: { mt: 0.5 } } }}
      >
        {options.map((o) => (
          <MenuItem key={o.value} value={o.value}>
            <Box
              component="span"
              sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}
            >
              <Dot color={o.dot} />
              {o.label}
            </Box>
          </MenuItem>
        ))}
      </CompactSelect>
    </Box>
  );
}
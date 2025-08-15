import { useMemo } from "react";
import { Box, MenuItem, Select, styled } from "@mui/material";
import type { Candidate, InterviewStatus } from "src/types/domain";
import type { StatusOption } from "src/config/statusConfig";
import { usePatchCandidateMutation } from "src/api/candidatesApi";

type Props = {
  row: Candidate;
  value?: InterviewStatus;
  options: StatusOption[];
  onChange?: (next: InterviewStatus, row: Candidate) => void;
  widthPx?: number;
};

const STATUS_WIDTH_DEFAULT = 215;

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

export default function StatusCell({
  row,
  value,
  options,
  onChange,
  widthPx,
}: Props) {
  const current = useMemo(() => {
    const v = value ?? row.interviews?.[0]?.status ?? "not_held";
    return options.find((o) => o.value === v) ?? options[0];
  }, [options, value, row.interviews]);

  const [patchCandidate] = usePatchCandidateMutation();

  const handleChange = async (next: InterviewStatus) => {
  if (onChange) {
    onChange(next, row);
    return;
  }

  const list = row.interviews?.length ? [...row.interviews] : [];
  const nowIso = new Date().toISOString();

  if (list.length === 0) {
    list.unshift({
      status: next,
      scheduledAt: next === "success" || next === "declined" ? nowIso : undefined,
    } as any);
  } else {
    const head = { ...list[0], status: next };
    if (next === "success" || next === "declined") head.scheduledAt = nowIso;
    list[0] = head;
  }

  const map: Record<InterviewStatus, keyof Candidate | null> = {
    not_held: null,
    reserve:  null,         
    success:  "acceptedAt",
    declined: "declinedAt",
    canceled: "canceledAt",
  };

  const body: any = { interviews: list };

  const field = map[next];
  if (field) {
    body[field] = nowIso;
  }

  await patchCandidate({ id: row._id, body }).unwrap();
};

  const width = widthPx ?? STATUS_WIDTH_DEFAULT;

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
          "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(0,0,0,0.12)" },
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
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
              <Dot color={o.dot} />
              {o.label}
            </Box>
          </MenuItem>
        ))}
      </CompactSelect>
    </Box>
  );
}
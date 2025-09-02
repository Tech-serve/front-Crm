import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useDeleteCandidateMutation } from "src/api/candidatesApi";

type Props = { id: string };

export default function DeleteCandidateCell({ id }: Props) {
  const [del] = useDeleteCandidateMutation();

  const onClick = () => {
    if (confirm("Удалить кандидата без возможности восстановления?")) {
      del(id);
    }
  };

  return (
    <Tooltip title="Удалить кандидата">
      <IconButton size="small" color="error" onClick={onClick}>
        <CloseRoundedIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
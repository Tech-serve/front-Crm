import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useDeleteEmployeeMutation } from "src/api/employeesApi";

type Props = { id: string };

export default function DeleteEmployeeCell({ id }: Props) {
  const [del] = useDeleteEmployeeMutation();

  const handleClick = () => {
    if (confirm("Удалить сотрудника без возможности восстановления?")) {
      del(id);
    }
  };

  return (
    <Tooltip title="Удалить сотрудника">
      <IconButton size="small" color="error" onClick={handleClick}>
        <CloseRoundedIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  );
}
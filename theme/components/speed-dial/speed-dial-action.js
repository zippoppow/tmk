import { palette } from "../../styles";

export const speedDialAction = {
  styleOverrides: {
    fab: {
      width: "48px",
      height: "48px",
      color: palette.grey[600],
      backgroundColor: palette.common.white,
      border: `1px solid ${palette.grey[100]}`,
      transition: "all 200ms ease-out",

      "&:hover": {
        color: palette.grey[900],
        backgroundColor: palette.common.white,
        borderColor: palette.grey[900],
      },
    },
  },
};

export default speedDialAction;

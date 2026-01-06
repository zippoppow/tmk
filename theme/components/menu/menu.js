import { palette, shape } from "../../styles";

export const menu = {
  styleOverrides: {
    paper: {
      backgroundColor: `${palette.common.white} !important`,
      border: `1px solid ${palette.grey[100]}`,
      borderRadius: shape.borderRadiusMD,
      boxShadow: "none !important",
      padding: "0 !important",
    },
  },
};

export default menu;

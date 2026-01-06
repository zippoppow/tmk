import { palette } from "../../styles";

export const standardInput = {
  styleOverrides: {
    root: {
      marginTop: "0 !important",

      "&::before": {
        borderBottom: `2px solid ${palette.grey[400]} !important`,
      },

      "&::after": {
        borderBottom: `2px solid ${palette.grey[900]} !important`,
      },

      "&.Mui-error::before, &.Mui-error::after": {
        borderBottom: `2px solid ${palette.red[600]} !important`,
      },
    },

    input: {
      transform: "translateY(12px) !important",
    },
  },
};

export default standardInput;

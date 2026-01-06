import { palette, shape } from "../../styles";

export const filledInput = {
  styleOverrides: {
    root: {
      backgroundColor: palette.grey[100],
      borderRadius: shape.borderRadiusMD,
      border: "2px solid transparent",

      "&::before, &::after": {
        content: "none",
      },

      "&:hover": {
        backgroundColor: palette.grey[200],
      },

      "&.Mui-error": {
        "&:hover": {
          backgroundColor: palette.red[100],
        },

        "&.Mui-focused": {
          borderColor: palette.red[600],
          backgroundColor: palette.red[100],
        },
      },

      "&.Mui-focused": {
        borderColor: palette.grey[900],
        backgroundColor: palette.common.white,
      },

      "&.Mui-disabled": {
        backgroundColor: palette.grey[50],
      },
    },

    input: {
      padding: 0,
    },
  },
};

export default filledInput;

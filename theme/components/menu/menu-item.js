import { palette, typography } from "../../styles";

export const menuItem = {
  styleOverrides: {
    root: {
      fontSize: typography.fontSizeMD,
      color: palette.grey[600],

      "&:hover": {
        backgroundColor: `${palette.grey[50]} !important`,
      },

      "&:focus": {
        boxShadow: `0 0 0 4px inset ${palette.purple[200]}`,
      },

      '&[aria-selected="true"]': {
        fontWeight: typography.fontWeightBold,
        color: palette.grey[900],
        backgroundColor: "transparent !important",
      },

      "&.Mui-focusVisible": {
        backgroundColor: "transparent !important",
      },
    },
  },
};

export default menuItem;

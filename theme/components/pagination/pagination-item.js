import { palette, typography } from "../../styles";

export const paginationItem = {
  styleOverrides: {
    root: {
      fontSize: typography.fontSizeMD,
      color: palette.grey[900],

      "&.Mui-disabled": {
        color: palette.grey[900],
        opacity: 0.5
      },

      "&:hover": {
        backgroundColor: palette.grey[300]
      }
    },
    sizeSmall: {
      fontSize: typography.fontSizeSM
    },
    outlined: {
      borderColor: palette.grey[400]
    }
  }
};

export default paginationItem;

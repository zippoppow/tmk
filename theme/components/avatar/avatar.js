import { palette, typography } from "../../styles";

export const avatar = {
  styleOverrides: {
    root: {
      backgroundColor: palette.purple[600],
      fontSize: typography.fontSizeMD,
      fontWeight: typography.fontWeightMedium,
    },

    colorDefault: {
      backgroundColor: palette.grey[100],
      color: palette.grey[500],
      fontWeight: typography.fontWeightBold,
    },
  },
};

export default avatar;

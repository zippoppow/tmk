import { palette, shape, typography } from "../styles";

export const popover = {
  styleOverrides: {
    paper: {
      backgroundColor: palette.grey[100],
      borderRadius: shape.borderRadiusLG,
      boxShadow: "none",
      padding: "16px 24px",
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSizeMD,
      color: palette.grey[900],
      margin: "4px",
    },
  },
};

export default popover;

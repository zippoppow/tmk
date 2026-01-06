import { palette, typography } from "../../styles";

export const accordionDetails = {
  styleOverrides: {
    root: {
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeightRegular,
      lineHeight: "32px",
      color: palette.grey[700],
      padding: "0 24px 32px"
    }
  }
};

export default accordionDetails;

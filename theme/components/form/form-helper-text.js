import { palette, typography } from "../../styles";

export const formHelperText = {
  styleOverrides: {
    root: {
      margin: "4px 0 0",
      fontSize: typography.fontSizeSM,
      color: palette.grey[900],

      "&.Mui-disabled": {
        opacity: 0.5
      }
    }
  }
};

export default formHelperText;

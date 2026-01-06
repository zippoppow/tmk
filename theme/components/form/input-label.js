import { palette, typography } from "../../styles";

export const inputLabel = {
  styleOverrides: {
    root: {
      fontSize: typography.fontSizeMD,
      lineHeight: 1.5,
      color: palette.grey[600],
      transform: "translate(18px, 16px)",
      zIndex: 2,
      transition: "all 200ms ease-out",

      "&.Mui-focused": {
        color: palette.grey[600],
      },

      "&.Mui-disabled": {
        opacity: 0.5,
      },

      "&.Mui-error": {
        color: palette.red[600],
      },

      "&.MuiFormLabel-root ~ .MuiInputBase-root .MuiInputBase-input": {
        transform: "translateY(10px)",
      },
    },

    shrink: {
      fontSize: typography.fontSizeSM,
      color: palette.grey[600],
      fontWeight: typography.fontWeightMedium,
      transform: "translate(18px, 6px)",

      "&.Mui-error": {
        color: palette.red[700],
      },
    },

    standard: {
      color: palette.grey[600],
      transform: "translate(18px, 16px)",

      "&.MuiInputLabel-shrink": {
        fontWeight: typography.fontWeightRegular,
        transform: "translate(18px, 6px)",
      },
    },
  },
};

export default inputLabel;

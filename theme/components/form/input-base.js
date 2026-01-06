import { palette, typography } from "../../styles";

export const inputBase = {
  styleOverrides: {
    root: {
      minHeight: "56px",
      padding: "10px 18px",
      color: palette.grey[900],
      overflow: "hidden",
      transition: "all 200ms ease-in",

      "&:not(.MuiInputBase-multiline)": {
        maxHeight: "56px",
        height: "56px",
      },

      "&.MuiInputBase-multiline": {
        padding: "20px",
      },

      "&.Mui-disabled": {
        opacity: 0.5,
        color: palette.grey[900],
      },

      "&.Mui-disabled.Mui-error": {
        backgroundColor: palette.red[100],
      },

      "&.Mui-error": {
        borderColor: palette.red[600],
        backgroundColor: palette.red[100],

        "&.MuiInputBase-adornedStart, &.MuiInputBase-adornedEnd, & .MuiInputAdornment-root, & .MuiAutocomplete-endAdornment .MuiButtonBase-root":
          {
            color: palette.red[600],
          },
      },

      "&.Mui-focused": {
        input: {
          transform: "translateY(10px)",
        },
      },

      "&.MuiInputBase-adornedStart, &.MuiInputBase-adornedEnd": {
        padding: "16px 18px",
        color: palette.grey[600],
      },

      "&.MuiInputBase-adornedStart .MuiInputBase-input": {
        marginLeft: "16px",
      },

      "&.MuiInputBase-adornedEnd .MuiInputBase-input": {
        marginRight: "16px",
      },
    },

    input: {
      fontSize: typography.fontSizeMD,
      color: palette.grey[900],
    },
  },
};

export default inputBase;

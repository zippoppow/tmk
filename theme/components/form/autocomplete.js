import React from "react";
import { palette, shape, typography } from "../../styles";
import { ChevronDown, Close } from "../../../icons/line/navigation";

export const autocomplete = {
  defaultProps: {
    popupIcon: React.cloneElement(ChevronDown),
    clearIcon: React.cloneElement(Close),
  },
  variants: [
    {
      props: { success: true },
      style: {
        "& .MuiInputBase-root": {
          borderColor: palette.green[600],
          backgroundColor: palette.green[100],

          "&:hover": {
            backgroundColor: palette.green[100],
          },

          "&.Mui-focused": {
            borderColor: palette.green[600],
            backgroundColor: palette.green[100],
          },

          "&.Mui-disabled": {
            backgroundColor: palette.green[100],
          },

          "&.MuiInputBase-adornedStart, &.MuiInputBase-adornedEnd, & .MuiInputAdornment-root":
            {
              color: palette.green[600],
            },
        },

        "& .MuiInputLabel-root": {
          color: palette.green[600],

          "&.Mui-focused": {
            color: palette.green[700],
          },
        },

        "& .MuiFormHelperText-root": {
          color: palette.green[600],
        },

        "& .MuiInput-root::before, & .MuiInput-root::after": {
          borderBottom: `2px solid ${palette.green[600]} !important`,
        },
      },
    },
    {
      props: {
        size: "large",
      },
      style: {
        "& .MuiInputBase-root": {
          minHeight: "64px",
          maxHeight: "64px",
          padding: "14px 20px",
        },

        "& .MuiFormLabel-root": {
          lineHeight: 2.1,
          transform: "translate(21px, 15px)",

          "&.MuiInputLabel-shrink": {
            transform: "translate(21px, 6px)",
          },
        },

        "& .MuiAutocomplete-endAdornment": {
          marginTop: 0,
        },
      },
    },
  ],
  styleOverrides: {
    root: {
      "& .MuiInputBase-root": {
        paddingRight: "18px !important",
      },
    },

    input: {
      padding: "28px 80px 12px 18px !important",
      transform: "translateY(-18px) !important",
      margin: "0 -18px 0 -19px !important",
    },

    endAdornment: {
      height: "24px",
      display: "flex",
      gap: "12px",
      position: "absolute",
      top: "50%",
      right: "16px !important",
      transform: "translateY(-50%)",

      "& .MuiButtonBase-root": {
        backgroundColor: "transparent",
        color: palette.grey[600],
        width: "24px",
        height: "100%",
        padding: 0,

        "&:hover, &:active, &:focus, &.Mui-disabled": {
          backgroundColor: "transparent",
          color: palette.grey[600],
          boxShadow: "none",
        },
      },
    },

    fullWidth: {
      "& .MuiInputBase-root": {
        paddingTop: "16px",
        paddingLeft: "18px",
      },
    },

    paper: {
      backgroundColor: palette.common.white,
      border: `1px solid ${palette.grey[100]}`,
      borderRadius: shape.borderRadiusMD,
      boxShadow: "none",
      margin: "8px 0",
    },

    listbox: {
      padding: "8px 0",
    },

    option: {
      fontSize: typography.fontSizeMD,
      color: palette.grey[600],

      "&.Mui-focused": {
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
    },

    noOptions: {
      fontSize: typography.fontSizeMD,
      color: palette.grey[600],
    },
  },
};

export default autocomplete;

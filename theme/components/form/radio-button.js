import React from "react";
import { palette, shape } from "../../styles";

function generateRadioButtonStyles(color) {
  return {
    "& .radio-default-checked-icon": {
      backgroundColor: palette[color][500],
    },
    "&:hover .radio-default-checked-icon": {
      backgroundColor: palette[color][700],
    },
  };
}

export const radioButton = {
  defaultProps: {
    size: "small",
    icon: React.createElement("i", { className: "radio-default-icon" }),
    checkedIcon: React.createElement("i", {
      className: "radio-default-checked-icon",
    }),
  },
  variants: [
    {
      props: { size: "small" },
      style: {
        width: "32px",
        height: "32px",
        borderRadius: shape.borderRadiusFull,

        "& .radio-default-checked-icon::after": {
          width: "12px",
          height: "12px",
          transform: "translate(-50%, -50%)",
        },
      },
    },
  ],
  styleOverrides: {
    root: {
      width: "40px",
      height: "40px",
      padding: 0,
      borderRadius: shape.borderRadiusFull,
      color: palette.grey[600],
      transition: "all 200ms ease-out",

      "&:hover": {
        backgroundColor: "transparent",
      },

      "&:focus": {
        boxShadow: `0 0 0 6px rgba(0,0,0, 0.1)`,
      },

      "&.Mui-disabled": {
        opacity: 0.5,
      },

      "& .radio-default-icon, .radio-default-checked-icon": {
        width: "100%",
        height: "100%",
        borderRadius: "inherit",
        position: "relative",
        transition: "all 200ms ease-out",
      },

      "& .radio-default-icon": {
        backgroundColor: palette.grey[300],
      },

      "&:hover .radio-default-icon": {
        backgroundColor: palette.grey[400],
      },

      "& .radio-default-checked-icon::after": {
        content: "' '",
        backgroundColor: palette.common.white,
        backgroundRepeat: "no-repeat",
        width: "16px",
        height: "16px",
        position: "absolute",
        borderRadius: shape.borderRadiusFull,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      },

      "&.MuiRadio-colorPrimary": generateRadioButtonStyles("purple"),
      "&.MuiRadio-colorSecondary": generateRadioButtonStyles("grey"),
      "&.MuiRadio-colorInfo": generateRadioButtonStyles("blue"),
      "&.MuiRadio-colorError": generateRadioButtonStyles("red"),
      "&.MuiRadio-colorSuccess": generateRadioButtonStyles("green"),
      "&.MuiRadio-colorWarning": generateRadioButtonStyles("yellow"),

      svg: {
        width: "100%",
        height: "100%",
      },
    },
  },
};

export default radioButton;

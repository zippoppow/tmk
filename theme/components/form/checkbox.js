import React from "react";
import { shape, palette } from "../../styles";

function generateCheckboxStyles(color) {
  return {
    "& .checkbox-default-checked-icon, & .checkbox-default-indeterminate-icon":
      {
        backgroundColor: palette[color][500],
      },
    "&:hover .checkbox-default-checked-icon, &:hover .checkbox-default-indeterminate-icon":
      {
        backgroundColor: palette[color][700],
      },
  };
}

export const checkbox = {
  defaultProps: {
    size: "small",
    icon: React.createElement("i", { className: "checkbox-default-icon" }),
    checkedIcon: React.createElement("i", {
      className: "checkbox-default-checked-icon",
    }),
    indeterminateIcon: React.createElement("i", {
      className: "checkbox-default-indeterminate-icon",
    }),
  },
  variants: [
    {
      props: { size: "small" },
      style: {
        width: "32px",
        height: "32px",
        borderRadius: shape.borderRadius,

        "& .checkbox-default-checked-icon::after, & .checkbox-default-indeterminate-icon::after":
          {
            transform: "translate(-32%, -32%)",
          },
      },
    },
  ],
  styleOverrides: {
    root: {
      width: "40px",
      height: "40px",
      padding: 0,
      borderRadius: shape.borderRadiusMD,
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

      "& .checkbox-default-icon, .checkbox-default-checked-icon, .checkbox-default-indeterminate-icon":
        {
          width: "100%",
          height: "100%",
          borderRadius: "inherit",
          position: "relative",
          transition: "all 200ms ease-out",
        },

      "& .checkbox-default-icon": {
        backgroundColor: palette.grey[300],
      },

      "&:hover .checkbox-default-icon": {
        backgroundColor: palette.grey[400],
      },

      "& .checkbox-default-checked-icon::after, & .checkbox-default-indeterminate-icon::after":
        {
          content: "' '",
          backgroundRepeat: "no-repeat",
          width: "100%",
          height: "100%",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-25%, -25%)",
        },

      "& .checkbox-default-checked-icon::after": {
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3.33398 10.2614L8.04803 14.9755L17.4761 5.54736' stroke='%23FFFFFF' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E%0A")`,
      },

      "& .checkbox-default-indeterminate-icon::after": {
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2.5 10H17.5' stroke='%23FFFFFF' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E%0A")`,
      },

      "&.MuiCheckbox-colorPrimary": generateCheckboxStyles("purple"),
      "&.MuiCheckbox-colorSecondary": generateCheckboxStyles("grey"),
      "&.MuiCheckbox-colorInfo": generateCheckboxStyles("blue"),
      "&.MuiCheckbox-colorError": generateCheckboxStyles("red"),
      "&.MuiCheckbox-colorSuccess": generateCheckboxStyles("green"),
      "&.MuiCheckbox-colorWarning": generateCheckboxStyles("yellow"),

      svg: {
        width: "100%",
        height: "100%",
      },
    },
  },
};

export default checkbox;

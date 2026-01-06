import React from "react";
import { palette, typography } from "../../styles";
import { Plus } from "../../../icons/line/navigation";

export const accordionSummary = {
  defaultProps: {
    expandIcon: React.cloneElement(Plus, {
      width: 24,
      height: 24,
    }),
  },
  styleOverrides: {
    root: {
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSizeXL,
      fontWeight: typography.fontWeightMedium,
      color: palette.grey[900],
      padding: "20px 24px",
      transition: "all 250ms ease-out",

      "&.Mui-expanded": {
        padding: "32px 24px",
      },
    },
    content: {
      margin: 0,

      "&.Mui-expanded": {
        margin: 0,
      },
    },
    expandIconWrapper: {
      color: palette.grey[900],

      "&.Mui-expanded": {
        transform: "rotate(135deg)",
      },
    },
  },
};

export default accordionSummary;

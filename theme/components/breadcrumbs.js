import React from "react";
import { palette, typography } from "../styles";
import { ChevronForward } from "../../icons/line/navigation";

export const breadcrumbs = {
  defaultProps: {
    separator: React.cloneElement(ChevronForward, {
      width: 20,
      height: 20,
    }),
  },
  styleOverrides: {
    root: {
      fontSize: typography.fontSizeMD,
    },
    separator: {
      color: palette.grey[400],
    },
    li: {
      "& .MuiLink-root": {
        color: palette.purple[500],
        textDecoration: "none",
        fontWeight: typography.fontWeightBold,

        "&:hover": {
          color: palette.purple[700],
        },
      },
    },
  },
};

export default breadcrumbs;

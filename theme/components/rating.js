import React from "react";
import { palette } from "../styles";
import { Star } from "../../icons/filled/general";
import { Star as StarOutlined } from "../../icons/line/general";

export const rating = {
  defaultProps: {
    emptyIcon: React.cloneElement(StarOutlined, {
      width: "100%",
      height: "100%",
    }),
    icon: React.cloneElement(Star, {
      width: "100%",
      height: "100%",
    }),
  },
  styleOverrides: {
    root: {
      gap: "3px",
      color: palette.grey[500],

      "&.Mui-disabled": {
        opacity: 1,

        "& .MuiRating-iconEmpty": {
          color: palette.grey[400],
        },

        "& .MuiRating-iconFilled": {
          opacity: 0.5,
        },
      },
    },
    iconEmpty: {
      color: palette.grey[500],
    },
    iconFilled: {
      color: palette.purple[500],
      strokeWidth: 2,
      stroke: "currentColor",
    },
    iconHover: {
      transform: "scale(1)",
    },
    sizeSmall: {
      "& .MuiRating-icon": {
        width: "18px",
        height: "18px",
      },
    },
    sizeMedium: {
      "& .MuiRating-icon": {
        width: "24px",
        height: "24px",
      },
    },
    sizeLarge: {
      "& .MuiRating-icon": {
        width: "32px",
        height: "32px",
      },
    },
  },
};

export default rating;

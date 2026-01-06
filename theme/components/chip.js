import React from "react";
import { palette, typography, shape } from "../styles";
import { Close } from "../../icons/line/navigation";

function generateFilledChip(color) {
  return {
    backgroundColor: palette[color][200],
  };
}

function generateOutlinedChip(color) {
  return {
    borderColor: palette[color][500],

    "& .MuiChip-label": {
      color: palette[color][500],
    },

    "& .MuiChip-deleteIcon, & .MuiChip-deleteIcon:hover": {
      color: palette[color][500],
    },
  };
}

export const chip = {
  defaultProps: {
    deleteIcon: React.cloneElement(Close, {
      width: 18,
      height: 18,
    }),
  },
  styleOverrides: {
    root: {
      borderRadius: shape.borderRadius,

      "& .MuiChip-deleteIcon, & .MuiChip-deleteIcon:hover": {
        color: palette.grey[900],
      },
    },
    sizeMedium: {
      padding: "6px 0",
      fontSize: typography.fontSizeMD,

      "& .MuiChip-label": {
        padding: "0 12px",
      },

      "& .MuiChip-deleteIcon": {
        marginRight: "12px",
      },
    },
    sizeSmall: {
      padding: "4px 0",
      fontSize: typography.fontSizeSM,
      fontWeight: typography.fontWeightMedium,

      "& .MuiChip-label": {
        padding: "0 8px",
      },

      "& .MuiChip-deleteIcon": {
        marginRight: "8px",
      },
    },
    label: {
      color: palette.grey[900],
    },
    filled: {
      backgroundColor: palette.grey[100],
    },
    outlined: {
      borderColor: palette.grey[900],
      borderWidth: "2px",
    },
    filledPrimary: generateFilledChip("purple"),
    filledSecondary: generateFilledChip("grey"),
    filledError: generateFilledChip("red"),
    filledSuccess: generateFilledChip("green"),
    filledInfo: generateFilledChip("blue"),
    filledWarning: generateFilledChip("yellow"),
    outlinedPrimary: generateOutlinedChip("purple"),
    outlinedSecondary: generateOutlinedChip("grey"),
    outlinedError: generateOutlinedChip("red"),
    outlinedSuccess: generateOutlinedChip("green"),
    outlinedInfo: generateOutlinedChip("blue"),
    outlinedWarning: generateOutlinedChip("yellow"),
  },
};

export default chip;

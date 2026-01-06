import { shape, palette, typography } from "../../styles";

function generateContainedButton(color) {
  return {
    [color === "yellow" ? "&:hover" : null]: {
      color: palette.common.white,
    },

    "&:focus": {
      boxShadow: `0 0 0 6px ${palette[color][100]}`,
    },

    "&:active": {
      backgroundColor: palette[color][800],
      [color === "yellow" ? "color" : null]: palette.common.white,
    },

    "&.Mui-disabled": {
      opacity: 0.5,
      color: palette.common.white,
      backgroundColor: palette[color][500],
    },
  };
}

function generateOutlinedButton(color) {
  return {
    color: palette[color][500],
    borderColor: palette[color][500],

    "&:hover": {
      borderWidth: 2,
      color: palette[color][700],
      borderColor: palette[color][700],
    },

    "&:focus": {
      borderColor: "transparent",
      boxShadow: `0 0 0 6px ${palette[color][200]}`,
    },

    "&:active": {
      color: palette[color][800],
      borderColor: palette[color][800],
    },

    "&.Mui-disabled": {
      opacity: 0.5,
      borderWidth: 2,
      color: palette[color][500],
      borderColor: palette[color][500],
    },
  };
}

function generateTextButton(color) {
  return {
    "&:hover": {
      color: palette[color][700],
    },

    "&:active": {
      color: palette[color][800],
    },

    "&.Mui-disabled": {
      opacity: 0.5,
      color: palette[color][500],
    },
  };
}

export const button = {
  styleOverrides: {
    root: {
      boxShadow: "none",
      fontWeight: `${typography.fontWeightMedium} !important`,

      "&:active": {
        boxShadow: "none !important",
      },
    },
    outlined: {
      borderWidth: 2,

      "&:hover": {
        backgroundColor: "transparent",
      },
    },
    text: {
      "&:hover": {
        backgroundColor: "rgba(255, 255, 255, 0.8)",
      },

      "&:focus": {
        boxShadow: `0 0 0 6px ${palette.grey[300]}`,
      },
    },
    sizeSmall: {
      padding: "9px 16px",
      borderRadius: shape.borderRadius,
      ...typography.button,
    },
    sizeMedium: {
      padding: "12px 20px",
      borderRadius: shape.borderRadiusMD,
      ...typography.body2,
    },
    sizeLarge: {
      padding: "16px 24px",
      borderRadius: shape.borderRadiusLG,
      ...typography.body1,
    },
    containedPrimary: generateContainedButton("purple"),
    containedSecondary: generateContainedButton("grey"),
    containedSuccess: generateContainedButton("green"),
    containedError: generateContainedButton("red"),
    containedInfo: generateContainedButton("blue"),
    containedWarning: generateContainedButton("yellow"),
    outlinedPrimary: generateOutlinedButton("purple"),
    outlinedSecondary: generateOutlinedButton("grey"),
    outlinedSuccess: generateOutlinedButton("green"),
    outlinedError: generateOutlinedButton("red"),
    outlinedInfo: generateOutlinedButton("blue"),
    outlinedWarning: generateOutlinedButton("yellow"),
    textPrimary: generateTextButton("purple"),
    textSecondary: generateTextButton("grey"),
    textSuccess: generateTextButton("green"),
    textError: generateTextButton("red"),
    textInfo: generateTextButton("blue"),
    textWarning: generateTextButton("yellow"),
  },
};

export default button;

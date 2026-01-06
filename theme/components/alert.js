import { palette, shape, typography } from "../styles";

function generateAlertStandard(color) {
  return {
    backgroundColor: palette[color][100],

    "& .MuiAlert-icon": {
      color: palette[color][500],
    },

    "& .MuiAlert-message": {
      color: palette[color][color === "yellow" ? 800 : 900],
    },
  };
}

function generateAlertOutlined(color) {
  return {
    borderColor: palette[color][500],

    "& .MuiAlert-icon": {
      color: palette[color][500],
    },

    "& .MuiAlert-message": {
      color: palette[color][500],
    },

    "& .MuiAlert-action *": {
      color: palette[color][500],
    },
  };
}

function generateAlertFilled(color) {
  return {
    backgroundColor: palette[color][500],
  };
}

export const alert = {
  styleOverrides: {
    root: {
      borderRadius: shape.borderRadiusMD,

      "& .MuiAlertTitle-root": {
        fontSize: typography.fontSize,
        lineHeight: 1.4,
      },
    },
    message: {
      fontSize: typography.fontSizeMD,
      lineHeight: 1.3,
    },
    outlined: {
      borderWidth: 2,
    },
    filled: {
      "& .MuiAlert-icon": {
        color: palette.common.white,
      },

      "& .MuiAlert-message": {
        color: palette.common.white,
      },

      "& .MuiAlert-action *": {
        color: palette.common.white,
      },
    },
    action: {
      padding: 0,
      height: "36px",

      "& *": {
        height: "100% !important",
        paddingTop: "6px !important",
        paddingBottom: "6px !important",
      },
    },
    standardSuccess: generateAlertStandard("green"),
    standardError: generateAlertStandard("red"),
    standardInfo: generateAlertStandard("blue"),
    standardWarning: generateAlertStandard("yellow"),
    outlinedSuccess: generateAlertOutlined("green"),
    outlinedError: generateAlertOutlined("red"),
    outlinedInfo: generateAlertOutlined("blue"),
    outlinedWarning: generateAlertOutlined("yellow"),
    filledSuccess: generateAlertFilled("green"),
    filledError: generateAlertFilled("red"),
    filledInfo: generateAlertFilled("blue"),
    filledWarning: generateAlertFilled("yellow"),
  },
};

export default alert;

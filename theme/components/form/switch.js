import { shape, palette } from "../../styles";

function generateSwitchColor(color) {
  return {
    backgroundColor: palette[color][500],
  };
}

function generateSwitchHoverColor(color) {
  return {
    backgroundColor: palette[color][700],
  };
}

export const switchButton = {
  defaultProps: {
    size: "small",
  },
  styleOverrides: {
    root: {
      padding: 0,
      borderRadius: shape.borderRadiusRounded,
      transition: "all 200ms ease-out",

      "&:hover .MuiSwitch-track": {
        backgroundColor: palette.grey[400],
      },

      "&:hover .MuiSwitch-switchBase.Mui-disabled+.MuiSwitch-track": {
        backgroundColor: palette.grey[400],
      },

      "&:focus": {
        boxShadow: `0 0 0 6px rgba(0,0,0, 0.1)`,
      },

      "&:hover .MuiSwitch-switchBase.Mui-checked": {
        "&.MuiSwitch-colorPrimary+.MuiSwitch-track":
          generateSwitchHoverColor("purple"),
        "&.MuiSwitch-colorSecondary+.MuiSwitch-track":
          generateSwitchHoverColor("grey"),
        "&.MuiSwitch-colorSuccess+.MuiSwitch-track":
          generateSwitchHoverColor("green"),
        "&.MuiSwitch-colorError+.MuiSwitch-track":
          generateSwitchHoverColor("red"),
        "&.MuiSwitch-colorInfo+.MuiSwitch-track":
          generateSwitchHoverColor("blue"),
        "&.MuiSwitch-colorWarning+.MuiSwitch-track":
          generateSwitchHoverColor("yellow"),
      },
    },

    switchBase: {
      padding: "0 !important",
      top: 2,
      left: 2,

      "&.Mui-checked": {
        color: palette.common.white,

        "&+ .MuiSwitch-track": {
          opacity: 1,
        },

        "& .MuiSwitch-input": {
          left: "-150%",
        },

        "&.MuiSwitch-colorPrimary+.MuiSwitch-track":
          generateSwitchColor("purple"),
        "&.MuiSwitch-colorSecondary+.MuiSwitch-track":
          generateSwitchColor("grey"),
        "&.MuiSwitch-colorSuccess+.MuiSwitch-track":
          generateSwitchColor("green"),
        "&.MuiSwitch-colorError+.MuiSwitch-track": generateSwitchColor("red"),
        "&.MuiSwitch-colorInfo+.MuiSwitch-track": generateSwitchColor("blue"),
        "&.MuiSwitch-colorWarning+.MuiSwitch-track":
          generateSwitchColor("yellow"),
      },

      "&.Mui-disabled+.MuiSwitch-track": {
        opacity: 0.5,
        pointerEvents: "none",
      },
    },

    input: {
      height: "115%",
      top: "-2px",
      left: "-50%",
    },

    thumb: {
      width: "100% !important",
      height: "100% !important",
    },

    track: {
      backgroundColor: palette.grey[300],
      opacity: 1,
      transition: "all 200ms ease-out",
    },

    sizeSmall: {
      width: "60px",
      height: "32px",

      "& .MuiSwitch-switchBase": {
        width: "28px",
        height: "28px",

        "&.Mui-checked": {
          transform: "translateX(28px)",
        },
      },
    },

    sizeMedium: {
      width: "68px",
      height: "36px",

      "& .MuiSwitch-switchBase": {
        width: "32px",
        height: "32px",

        "&.Mui-checked": {
          transform: "translateX(32px)",
        },
      },
    },
  },
};

export default switchButton;

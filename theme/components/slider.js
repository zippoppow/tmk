import { palette, shape, typography } from "../styles";

function generateSliderThumb(color) {
  return {
    borderColor: palette[color][500],

    "&::after": {
      backgroundColor: palette[color][500],
    },
  };
}

function generateSliderTrack(color) {
  return {
    color: palette[color][700],

    "& .MuiSlider-thumb": {
      borderColor: palette[color][700],

      "&::after": {
        backgroundColor: palette[color][700],
      },
    },
  };
}

export const slider = {
  styleOverrides: {
    root: {
      height: "12px",
      borderRadius: shape.borderRadiusLG,

      "&.MuiSlider-dragging": {
        "&.MuiSlider-colorPrimary": generateSliderTrack("purple"),
        "&.MuiSlider-colorSecondary": generateSliderTrack("grey"),
        "&.MuiSlider-colorError": generateSliderTrack("red"),
        "&.MuiSlider-colorSuccess": generateSliderTrack("green"),
        "&.MuiSlider-colorInfo": generateSliderTrack("blue"),
        "&.MuiSlider-colorWarning": generateSliderTrack("yellow"),
      },

      "&.Mui-disabled": {
        "& .MuiSlider-rail": {
          backgroundColor: palette.grey[100],
        },

        "& .MuiSlider-thumb": {
          borderColor: palette.grey[300],

          "&::after": {
            backgroundColor: palette.grey[300],
          },
        },
      },
    },
    rail: {
      opacity: 1,
      backgroundColor: palette.grey[300],
    },
    thumb: {
      width: "32px",
      height: "32px",
      backgroundColor: palette.common.white,
      border: `2px solid transparent`,
      boxShadow: "none",

      "&::after": {
        content: "' '",
        width: "2px",
        height: "8px",
        borderRadius: shape.borderRadius,
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      },

      "&:hover, &:active, &.Mui-focusVisible": {
        boxShadow: "none",
      },

      "&.MuiSlider-thumbColorPrimary": generateSliderThumb("purple"),
      "&.MuiSlider-thumbColorSecondary": generateSliderThumb("grey"),
      "&.MuiSlider-thumbColorError": generateSliderThumb("red"),
      "&.MuiSlider-thumbColorSuccess": generateSliderThumb("green"),
      "&.MuiSlider-thumbColorInfo": generateSliderThumb("blue"),
      "&.MuiSlider-thumbColorWarning": generateSliderThumb("yellow"),
    },
    valueLabel: {
      backgroundColor: palette.grey[800],
      borderRadius: shape.borderRadius,
      fontSize: typography.fontSizeSM,
      lineHeight: 1.4,
      padding: "8px 9px",
    },
  },
};

export default slider;

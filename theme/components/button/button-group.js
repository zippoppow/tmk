import { palette } from "../../styles";

function generateButtonGroupOutlined(color) {
  return {
    "&:focus": {
      borderColor: palette[color][500],
    },
  };
}

export const buttonGroup = {
  defaultProps: {
    disableRipple: true,
  },
  styleOverrides: {
    grouped: {
      "&:focus": {
        zIndex: 2,
      },
    },

    groupedOutlinedPrimary: generateButtonGroupOutlined("purple"),
    groupedOutlinedSecondary: generateButtonGroupOutlined("blue"),
    groupedOutlinedSuccess: generateButtonGroupOutlined("green"),
    groupedOutlinedError: generateButtonGroupOutlined("red"),
    groupedOutlinedInfo: generateButtonGroupOutlined("blue"),
    groupedOutlinedWarning: generateButtonGroupOutlined("yellow"),
  },
};

export default buttonGroup;

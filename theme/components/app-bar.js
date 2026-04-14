import { palette, shape } from "../styles";

export const appBar = {
  styleOverrides: {
    root: {
      backgroundColor: palette.primary.main,
      color: palette.common.white,
      boxShadow: "0 14px 32px rgba(32, 16, 50, 0.18)",
    },
    positionRelative: {
      borderRadius: shape.borderRadiusLG
    },
    positionSticky: {
      borderRadius: shape.borderRadiusLG
    },
    positionStatic: {
      borderRadius: shape.borderRadiusLG
    }
  }
};

export default appBar;

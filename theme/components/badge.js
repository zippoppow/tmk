import { palette, typography } from "../styles";

export const badge = {
  styleOverrides: {
    badge: {
      fontSize: typography.fontSizeSM
    },
    dot: {
      boxShadow: `0 0 0 2px ${palette.common.white}`
    }
  }
};

export default badge;

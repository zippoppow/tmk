import { shape } from "../../styles";

import { palette } from "../../styles";

export const card = {
  styleOverrides: {
    root: {
      borderRadius: shape.borderRadiusLG,
      boxShadow: "0 16px 40px rgba(32, 16, 50, 0.08)",
      border: `1px solid ${palette.grey[200]}`,
      backgroundColor: palette.common.white,
    },
    paper: {
      boxShadow: "0 16px 40px rgba(32, 16, 50, 0.08)",
    }
  }
};

export default card;

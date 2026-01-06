import { palette, shape } from "../../styles";

export const linearProgress = {
  styleOverrides: {
    root: {
      backgroundColor: palette.grey[200],
      height: "8px",
      borderRadius: shape.borderRadiusLG,
    },
    bar: {
      borderRadius: shape.borderRadiusLG,
    },
  },
};

export default linearProgress;

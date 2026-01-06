import { palette, shape } from "../styles";

export const skeleton = {
  styleOverrides: {
    root: {
      backgroundColor: palette.grey[200],
    },
    rounded: {
      borderRadius: shape.borderRadius,
    },
  },
};

export default skeleton;

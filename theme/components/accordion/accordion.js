import { palette, shape } from "../../styles";

export const accordion = {
  styleOverrides: {
    root: {
      marginBottom: "20px",
      border: `2px solid ${palette.grey[200]}`,
      borderRadius: shape.borderRadiusLG,
      boxShadow: "none",

      "&:first-of-type": {
        borderTopLeftRadius: shape.borderRadiusLG,
        borderTopRightRadius: shape.borderRadiusLG,
      },

      "&:last-of-type": {
        borderBottomLeftRadius: shape.borderRadiusLG,
        borderBottomRightRadius: shape.borderRadiusLG,
      },
    },
    gutters: {
      "&::before": {
        display: "none",
      },
    },
  },
};

export default accordion;

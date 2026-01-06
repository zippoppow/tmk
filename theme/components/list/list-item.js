import { palette } from "../../styles";

export const listItem = {
  styleOverrides: {
    root: {
      "&.Mui-selected": {
        backgroundColor: palette.grey[100],
      },

      "& .MuiListItemButton-root:hover": {
        backgroundColor: palette.grey[50],
      },
    },
  },
};

export default listItem;

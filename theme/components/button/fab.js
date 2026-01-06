import { palette } from "../../styles";

function generateFab(color) {
  return {
    "&.Mui-disabled": {
      opacity: 0.5,
      color: palette.common.white,
      backgroundColor: palette[color][500],
    },
  };
}

export const fab = {
  styleOverrides: {
    root: {
      "&.MuiFab-primary": generateFab("purple"),
      "&.MuiFab-secondary": generateFab("blue"),
      "&.Mui-error": generateFab("red"),
      "&.MuiFab-success": generateFab("green"),
      "&.MuiFab-info": generateFab("blue"),
      "&.MuiFab-warning": generateFab("yellow"),
    },
  },
};

export default fab;

import { shape, palette } from "../../styles";

function generateContainedIconButton(color) {
  return {
    backgroundColor: palette[color][500],
    color: color === "yellow" ? palette.common.black : palette.common.white,

    "&:hover": {
      backgroundColor: palette[color][700],
      [color === "yellow" ? "color" : null]: palette.common.white,
    },

    "&:focus": {
      boxShadow: `0 0 0 6px ${palette[color][100]}`,
    },

    "&:active": {
      backgroundColor: palette[color][800],
      [color === "yellow" ? "color" : null]: palette.common.white,
      boxShadow: "none",
    },

    "&.Mui-disabled": {
      opacity: 0.5,
      color: color === "yellow" ? palette.common.black : palette.common.white,
      backgroundColor: palette[color][500],
    },
  };
}

function generateOutlinedIconButton(color) {
  return {
    color: palette[color][500],
    border: `2px solid ${palette[color][500]}`,

    "&:hover": {
      color: palette[color][700],
      borderColor: palette[color][700],
    },

    "&:focus": {
      borderColor: "transparent",
      boxShadow: `0 0 0 6px ${palette[color][200]}`,
    },

    "&:active": {
      color: palette[color][800],
      borderColor: palette[color][800],
    },

    "&.Mui-disabled": {
      opacity: 0.5,
      color: palette[color][700],
      borderColor: palette[color][700],
    },
  };
}

function generateTextIconButton(color) {
  return {
    color: palette[color][500],

    "&:hover": {
      color: palette[color][700],
    },

    "&:active": {
      color: palette[color][800],
    },

    "&.Mui-disabled": {
      opacity: 0.5,
      color: palette[color][500],
    },
  };
}

export const iconButton = {
  defaultProps: {
    variant: "contained",
    color: "primary",
  },
  variants: [
    {
      props: { variant: "contained", color: "primary" },
      style: generateContainedIconButton("purple"),
    },
    {
      props: { variant: "contained", color: "secondary" },
      style: generateContainedIconButton("grey"),
    },
    {
      props: { variant: "contained", color: "success" },
      style: generateContainedIconButton("green"),
    },
    {
      props: { variant: "contained", color: "error" },
      style: generateContainedIconButton("red"),
    },
    {
      props: { variant: "contained", color: "info" },
      style: generateContainedIconButton("blue"),
    },
    {
      props: { variant: "contained", color: "warning" },
      style: generateContainedIconButton("yellow"),
    },
    {
      props: { variant: "outlined", color: "primary" },
      style: generateOutlinedIconButton("purple"),
    },
    {
      props: { variant: "outlined", color: "secondary" },
      style: generateOutlinedIconButton("grey"),
    },
    {
      props: { variant: "outlined", color: "success" },
      style: generateOutlinedIconButton("green"),
    },
    {
      props: { variant: "outlined", color: "error" },
      style: generateOutlinedIconButton("red"),
    },
    {
      props: { variant: "outlined", color: "info" },
      style: generateOutlinedIconButton("blue"),
    },
    {
      props: { variant: "outlined", color: "warning" },
      style: generateOutlinedIconButton("yellow"),
    },
    {
      props: { variant: "text" },
      style: {
        "&:hover": {
          backgroundColor: "rgba(255, 255, 255, 0.8)",
        },

        "&:focus": {
          boxShadow: `0 0 0 6px ${palette.grey[300]}`,
        },
      },
    },
    {
      props: { variant: "text", color: "primary" },
      style: generateTextIconButton("purple"),
    },
    {
      props: { variant: "text", color: "secondary" },
      style: generateTextIconButton("grey"),
    },
    {
      props: { variant: "text", color: "success" },
      style: generateTextIconButton("green"),
    },
    {
      props: { variant: "text", color: "error" },
      style: generateTextIconButton("red"),
    },
    {
      props: { variant: "text", color: "info" },
      style: generateTextIconButton("blue"),
    },
    {
      props: { variant: "text", color: "warning" },
      style: generateTextIconButton("yellow"),
    },
  ],
  styleOverrides: {
    root: {
      transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
    },
    sizeSmall: {
      padding: "12px",
      width: "40px",
      height: "40px",
      borderRadius: shape.borderRadius,
    },
    sizeMedium: {
      padding: "16px",
      width: "56px",
      height: "56px",
      borderRadius: shape.borderRadiusMD,
    },
    sizeLarge: {
      padding: "24px",
      width: "72px",
      height: "72px",
      borderRadius: shape.borderRadiusLG,
    },
  },
};

export default iconButton;

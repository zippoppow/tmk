import * as Tokens from "../../tokens";

const fontFamily = `'${Tokens.FontFamilyDisplay}', 'Helvetica', 'Arial', sans-serif`;
const fwLight = 300;
const fwRegular = 400;
const fwMedium = 500;
const fwBold = 700;

export const typography = {
  fontFamily,
  fontSize: 16,
  fontWeightLight: fwLight,
  fontWeightRegular: fwRegular,
  fontWeightMedium: fwMedium,
  fontWeightBold: fwBold,
  fontSizeXS: Tokens.Sizing2,
  fontSizeSM: Tokens.Sizing3,
  fontSizeMD: Tokens.Sizing4,
  fontSizeLG: Tokens.Sizing5,
  fontSizeXL: Tokens.Sizing6,
  fontSize2XL: Tokens.Sizing7,
  fontSize3XL: Tokens.Sizing8,
  fontSize4XL: Tokens.Sizing9,
  fontSize5XL: Tokens.Sizing10,
  fontSize6XL: Tokens.Sizing11,
  fontSize7XL: Tokens.Sizing12,
  h1: {
    fontFamily,
    fontWeight: fwBold,
    fontSize: Tokens.Sizing11,
    lineHeight: "1.0",
    letterSpacing: "1px",
  },
  h2: {
    fontFamily,
    fontWeight: fwBold,
    fontSize: Tokens.Sizing10,
    lineHeight: "1.0",
    letterSpacing: "1px",
  },
  h3: {
    fontFamily,
    fontWeight: fwBold,
    fontSize: Tokens.Sizing9,
    lineHeight: "1.0",
    letterSpacing: "1px",
  },
  h4: {
    fontFamily,
    fontWeight: fwBold,
    fontSize: Tokens.Sizing8,
    lineHeight: "1.1",
    letterSpacing: "1px",
  },
  h5: {
    fontFamily,
    fontWeight: fwBold,
    fontSize: Tokens.Sizing7,
    lineHeight: "1.1",
    letterSpacing: "1px",
  },
  h6: {
    fontFamily,
    fontWeight: fwBold,
    fontSize: Tokens.Sizing6,
    lineHeight: "1.1",
    letterSpacing: "0.75px",
  },
  subtitle1: {
    fontFamily,
    fontWeight: fwRegular,
    fontSize: Tokens.Sizing6,
    lineHeight: "1.25",
    letterSpacing: "0.75px",
  },
  subtitle2: {
    fontFamily,
    fontWeight: fwRegular,
    fontSize: Tokens.Sizing5,
    lineHeight: "1.25",
    letterSpacing: "0.75px",
  },
  body1: {
    fontFamily,
    fontWeight: fwRegular,
    fontSize: Tokens.Sizing5,
    lineHeight: "1.7",
    letterSpacing: "0.75px",
  },
  body2: {
    fontFamily,
    fontWeight: fwRegular,
    fontSize: Tokens.Sizing4,
    lineHeight: "1.7",
    letterSpacing: "0.75px",
  },
  button: {
    fontFamily,
    fontWeight: fwRegular,
    fontSize: Tokens.Sizing4,
    lineHeight: "1.25",
    letterSpacing: "0.75px",
    textTransform: "none",
  },
  caption: {
    fontFamily,
    fontWeight: fwRegular,
    fontSize: Tokens.Sizing3,
    lineHeight: "1.25",
    letterSpacing: "0.25px",
  },
  overline: {
    fontFamily,
    fontWeight: fwRegular,
    fontSize: Tokens.Sizing3,
    lineHeight: "1.25 ",
    textTransform: "uppercase",
  },
};

export default typography;

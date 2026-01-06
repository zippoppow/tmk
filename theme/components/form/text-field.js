import { palette } from "../../styles";

export const textField = {
  defaultProps: {
    variant: "filled"
  },
  variants: [
    {
      props: { success: true },
      style: {
        "& .MuiInputBase-root": {
          borderColor: palette.green[600],
          backgroundColor: palette.green[100],

          "&:hover": {
            backgroundColor: palette.green[100]
          },

          "&.Mui-focused": {
            borderColor: palette.green[600],
            backgroundColor: palette.green[100]
          },

          "&.Mui-disabled": {
            backgroundColor: palette.green[100]
          },

          "&.MuiInputBase-adornedStart, &.MuiInputBase-adornedEnd, & .MuiInputAdornment-root, & .MuiAutocomplete-endAdornment .MuiButtonBase-root":
            {
              color: palette.green[600]
            }
        },

        "& .MuiInputLabel-root": {
          color: palette.green[600],

          "&.Mui-focused": {
            color: palette.green[700]
          }
        },

        "& .MuiFormHelperText-root": {
          color: palette.green[600]
        },

        "& .MuiInput-root::before, & .MuiInput-root::after": {
          borderBottom: `2px solid ${palette.green[600]} !important`
        }
      }
    },
    {
      props: {
        size: "large"
      },
      style: {
        "& .MuiInputBase-root": {
          minHeight: "64px",
          maxHeight: "64px",
          padding: "14px 20px"
        },

        "& .MuiFormLabel-root": {
          lineHeight: 2.1,
          transform: "translate(21px, 16px)",

          "&.MuiInputLabel-shrink": {
            transform: "translate(21px, 6px)"
          }
        }
      }
    }
  ]
};

export default textField;

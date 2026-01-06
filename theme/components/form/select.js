import { ChevronDown } from "../../../icons/line/navigation";

export const select = {
  defaultProps: {
    variant: "filled",
    IconComponent: ChevronDown,
    autoFocus: false
  },
  styleOverrides: {
    select: {
      padding: "34px 18px 12px",
      background: "transparent !important",
      transform: "translateY(0px) !important",
      margin: "0 -18px 0 -19px !important"
    },

    icon: {
      marginTop: "-2px",
      marginRight: "4px"
    }
  }
};

export default select;

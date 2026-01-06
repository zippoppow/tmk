import { shape } from "../../styles";

export const tabs = {
  variants: [
    {
      props: { indicator: "dot" },
      style: {
        "& .MuiTabs-indicator": {
          width: "8px !important",
          height: "8px !important",
          transform: "translateX(36px)",
          borderRadius: shape.borderRadiusFull,
        },
      },
    },
  ],
};

export default tabs;

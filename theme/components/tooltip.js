import { palette, shape, typography } from "../styles";

export const tooltip = {
  styleOverrides: {
    tooltip: {
      backgroundColor: palette.grey[800],
      borderRadius: shape.borderRadius,
      fontSize: typography.fontSizeSM,
      fontWeight: typography.fontWeightMedium,
      padding: "4px 10px"
    },
    arrow: {
      color: palette.grey[800]
    },
    tooltipPlacementLeft: {
      "& .MuiTooltip-arrow": {
        marginRight: "-0.65em !important"
      }
    },
    tooltipPlacementRight: {
      "& .MuiTooltip-arrow": {
        marginLeft: "-0.65em !important"
      }
    }
  }
};

export default tooltip;

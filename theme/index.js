import { createTheme } from "@mui/material";

/******************** STYLES ********************/
import { palette, shape, shadows, typography } from "./styles";

/******************** COMPONENTS ********************/
import {
  buttonBase,
  button,
  iconButton,
  buttonGroup,
  fab,
} from "./components/button";
import {
  inputBase,
  filledInput,
  standardInput,
  inputLabel,
  inputAdornment,
  formHelperText,
  textField,
  checkbox,
  radioButton,
  switchButton,
  autocomplete,
  select,
  formControlLabel,
} from "./components/form";
import { menu, menuItem } from "./components/menu";
import { listItem, listItemText, listItemIcon } from "./components/list";
import { avatar, avatarGroup } from "./components/avatar";
import { circularProgress, linearProgress } from "./components/progress";
import { paginationItem } from "./components/pagination";
import { speedDialIcon, speedDialAction } from "./components/speed-dial";
import { card, cardActions } from "./components/card";
import {
  dialog,
  dialogTitle,
  dialogContent,
  dialogContentText,
  dialogActions,
} from "./components/dialog";
import {
  accordion,
  accordionSummary,
  accordionDetails,
} from "./components/accordion";
import badge from "./components/badge";
import rating from "./components/rating";
import slider from "./components/slider";
import chip from "./components/chip";
import divider from "./components/divider";
import alert from "./components/alert";
import typographyComponent from "./components/typography";
import skeleton from "./components/skeleton";
import tooltip from "./components/tooltip";
import breadcrumbs from "./components/breadcrumbs";
import popover from "./components/popover";
import appBar from "./components/app-bar";
import { tabs, tab } from "./components/tabs";
import { stepLabel } from "./components/stepper";

export const pegasus = createTheme({
  palette,
  shape,
  shadows,
  typography,
  components: {
    MuiButtonBase: buttonBase,
    MuiButton: button,
    MuiIconButton: iconButton,
    MuiButtonGroup: buttonGroup,
    MuiInputBase: inputBase,
    MuiFilledInput: filledInput,
    MuiInput: standardInput,
    MuiInputLabel: inputLabel,
    MuiInputAdornment: inputAdornment,
    MuiFormHelperText: formHelperText,
    MuiTextField: textField,
    MuiCheckbox: checkbox,
    MuiRadio: radioButton,
    MuiSwitch: switchButton,
    MuiAutocomplete: autocomplete,
    MuiSelect: select,
    MuiMenu: menu,
    MuiMenuItem: menuItem,
    MuiAvatar: avatar,
    MuiBadge: badge,
    MuiAvatarGroup: avatarGroup,
    MuiRating: rating,
    MuiSlider: slider,
    MuiChip: chip,
    MuiDivider: divider,
    MuiFab: fab,
    MuiAlert: alert,
    MuiTypography: typographyComponent,
    MuiListItem: listItem,
    MuiListItemText: listItemText,
    MuiListItemIcon: listItemIcon,
    MuiSkeleton: skeleton,
    MuiTooltip: tooltip,
    MuiCircularProgress: circularProgress,
    MuiLinearProgress: linearProgress,
    MuiPaginationItem: paginationItem,
    MuiBreadcrumbs: breadcrumbs,
    MuiPopover: popover,
    MuiAppBar: appBar,
    MuiSpeedDialIcon: speedDialIcon,
    MuiSpeedDialAction: speedDialAction,
    MuiCard: card,
    MuiCardActions: cardActions,
    MuiDialog: dialog,
    MuiDialogTitle: dialogTitle,
    MuiDialogContent: dialogContent,
    MuiDialogContentText: dialogContentText,
    MuiDialogActions: dialogActions,
    MuiAccordion: accordion,
    MuiAccordionSummary: accordionSummary,
    MuiAccordionDetails: accordionDetails,
    MuiTab: tab,
    MuiTabs: tabs,
    MuiStepLabel: stepLabel,
    MuiFormControlLabel: formControlLabel,
  },
});

export default pegasus;

export type PanelActionState = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialPanelActionState: PanelActionState = {
  success: false,
  message: "",
  fieldErrors: {},
};

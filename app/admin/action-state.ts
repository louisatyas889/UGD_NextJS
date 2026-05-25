export type CargoActionState = {
  success: boolean;
  message: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export const initialCargoActionState: CargoActionState = {
  success: false,
  message: "",
  fieldErrors: {},
};

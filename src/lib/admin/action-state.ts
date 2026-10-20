export type ActionState = {
  message: string;
  success?: boolean;
  id?: string;
  version?: number;
  destination?: string;
};
export const initialActionState: ActionState = { message: "" };

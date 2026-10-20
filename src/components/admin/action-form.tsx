"use client";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { initialActionState, type ActionState } from "@/lib/admin/action-state";
export type AdminAction = (
  state: ActionState,
  form: FormData,
) => Promise<ActionState>;
export function SaveButton({
  label = "Save changes",
  disabled = false,
}: {
  label?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button className="button" type="submit" disabled={pending || disabled}>
      {pending ? "Saving…" : label}
    </button>
  );
}
export function ActionForm({
  action,
  children,
  label = "Save changes",
  className = "",
  disabled = false,
}: {
  action: AdminAction;
  children: React.ReactNode;
  label?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  const router = useRouter();
  useEffect(() => {
    if (state.success) {
      if (state.destination) router.replace(state.destination);
      else if (state.id)
        router.replace(`/admin/books/${state.id}?notice=saved`);
      router.refresh();
    }
  }, [state, router]);
  return (
    <form action={formAction} className={`admin-form ${className}`}>
      {children}
      <div className="admin-form-actions">
        <SaveButton label={label} disabled={disabled} />
        {state.message && (
          <p
            role={state.success ? "status" : "alert"}
            className={state.success ? "admin-success" : "admin-error"}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}

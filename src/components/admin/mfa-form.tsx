"use client";
import { useActionState } from "react";
import Image from "next/image";
import {
  enrollMfa,
  verifyMfa,
  type EnrollmentState,
} from "@/app/admin/auth-actions";
import { ActionForm, SaveButton } from "./action-form";
export function MfaForm({ factorId }: { factorId?: string }) {
  const [state, action] = useActionState<EnrollmentState, FormData>(enrollMfa, {
    message: "",
  });
  const id = factorId || state.factorId;
  return (
    <>
      {!factorId && (
        <form action={action} className="admin-form">
          <p>
            Protect your archive with an authenticator app. Enrollment must be
            completed before any administrator data is accessible.
          </p>
          <SaveButton label="Set up authenticator" />
          {state.message && <p role="status">{state.message}</p>}
        </form>
      )}
      {state.qr && (
        <div className="mfa-enrollment">
          <Image
            src={state.qr}
            alt="Authenticator enrollment QR code"
            width={240}
            height={240}
            unoptimized
          />
          <p>
            Manual setup key: <code>{state.secret}</code>
          </p>
        </div>
      )}
      {id && (
        <ActionForm action={verifyMfa} label="Verify and continue">
          <input type="hidden" name="factorId" value={id} />
          <label htmlFor="code">Authenticator code</label>
          <input
            id="code"
            name="code"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
          />
        </ActionForm>
      )}
    </>
  );
}

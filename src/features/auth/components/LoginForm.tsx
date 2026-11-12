"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { TextField } from "@/components/forms/TextField";
import { PasswordField } from "@/components/forms/PasswordField";
import { FormAlert } from "@/components/forms/FormAlert";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { ApiError } from "@/lib/api/client";
import { authContent } from "@/data/auth-content";
import { authApi } from "../api";
import { useAuth } from "../AuthProvider";
import { applyServerErrors } from "../errors";
import { loginSchema, type LoginValues } from "../schemas";
import { AuthHeader } from "./AuthHeader";

const copy = authContent.login;

export function LoginForm() {
  const { login } = useAuth();
  const params = useSearchParams();
  const next = params.get("next");
  const justReset = params.get("reset") === "success";
  const [formError, setFormError] = useState<string | null>(null);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    setUnverifiedEmail(null);
    setResent(false);
    try {
      await login(values);
      // <GuestOnly> performs the redirect once the session is set.
    } catch (error) {
      // 403 = the account exists but the email isn't verified yet.
      if (error instanceof ApiError && error.status === 403) {
        if (/verify/i.test(error.message)) setUnverifiedEmail(values.email);
        else setFormError(error.message); // e.g. a disabled brand account
        return;
      }
      setFormError(applyServerErrors(error, setError, ["email", "password"], { 401: copy.invalidCredentials }) || null);
    }
  });

  const signupHref = next ? `/signup?next=${encodeURIComponent(next)}` : "/signup";

  return (
    <>
      <AuthHeader title={copy.title} description={copy.description} />

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {justReset && !formError && <FormAlert tone="success">{authContent.resetPassword.doneDescription}</FormAlert>}
        {formError && <FormAlert>{formError}</FormAlert>}
        {unverifiedEmail && (
          <FormAlert tone={resent ? "success" : undefined}>
            {resent ? authContent.checkEmail.resent : authContent.checkEmail.notVerified}{" "}
            {!resent && (
              <button
                type="button"
                onClick={() => authApi.resendVerification({ email: unverifiedEmail }).then(() => setResent(true), () => undefined)}
                className="font-medium text-white underline-offset-4 hover:underline"
              >
                {authContent.checkEmail.resend}
              </button>
            )}
          </FormAlert>
        )}

        <TextField
          label={copy.email.label}
          icon={Mail}
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder={copy.email.placeholder}
          error={errors.email?.message}
          {...register("email")}
        />

        <PasswordField
          label={copy.password.label}
          autoComplete="current-password"
          placeholder={copy.password.placeholder}
          error={errors.password?.message}
          labelAction={
            <Link href="/forgot-password" className="text-sm text-accent-bright transition-colors hover:text-white">
              {copy.forgot}
            </Link>
          }
          {...register("password")}
        />

        <SubmitButton loading={isSubmitting} loadingText={copy.submitting} className="mt-2">
          {copy.submit}
        </SubmitButton>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        {copy.switchPrompt}{" "}
        <Link href={signupHref} className="font-medium text-white underline-offset-4 hover:underline">
          {copy.switchAction}
        </Link>
      </p>
    </>
  );
}

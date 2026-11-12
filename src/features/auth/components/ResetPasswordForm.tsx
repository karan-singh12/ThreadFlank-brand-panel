"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { PasswordField } from "@/components/forms/PasswordField";
import { PasswordStrength } from "@/components/forms/PasswordStrength";
import { FormAlert } from "@/components/forms/FormAlert";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { ApiError } from "@/lib/api/client";
import { authContent } from "@/data/auth-content";
import { authApi } from "../api";
import { applyServerErrors } from "../errors";
import { resetPasswordSchema, type ResetPasswordValues } from "../schemas";
import { AuthHeader } from "./AuthHeader";

const copy = authContent.resetPassword;

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [linkInvalid, setLinkInvalid] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: { password: "", confirmPassword: "" },
  });
  const password = useWatch({ control, name: "password" });

  const onSubmit = handleSubmit(async ({ password }) => {
    setFormError(null);
    try {
      await authApi.resetPassword({ token, newPassword: password });
      router.replace("/login?reset=success");
    } catch (error) {
      if (error instanceof ApiError && error.status === 400 && !error.fieldErrors.length) {
        setLinkInvalid(true);
        return;
      }
      setFormError(applyServerErrors(error, setError, ["password"]) || null);
    }
  });

  return (
    <>
      <AuthHeader title={copy.title} description={copy.description} />

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {linkInvalid && (
          <FormAlert>
            {copy.invalidLink}{" "}
            <Link href="/forgot-password" className="font-medium text-white underline underline-offset-4">
              {copy.requestNew}
            </Link>
          </FormAlert>
        )}
        {formError && <FormAlert>{formError}</FormAlert>}

        <div className="flex flex-col gap-2.5">
          <PasswordField
            label={copy.password.label}
            autoComplete="new-password"
            placeholder={copy.password.placeholder}
            hint={copy.password.hint}
            error={errors.password?.message}
            {...register("password")}
          />
          <PasswordStrength value={password} />
        </div>

        <PasswordField
          label={copy.confirmPassword.label}
          autoComplete="new-password"
          placeholder={copy.confirmPassword.placeholder}
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <SubmitButton loading={isSubmitting} loadingText={copy.submitting} className="mt-2" disabled={linkInvalid}>
          {copy.submit}
        </SubmitButton>
      </form>

      <Link href="/login" className="group mt-8 flex items-center justify-center gap-2 text-sm text-muted transition-colors hover:text-white">
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
        {copy.back}
      </Link>
    </>
  );
}

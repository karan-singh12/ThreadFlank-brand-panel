"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Mail, MailCheck } from "lucide-react";
import { TextField } from "@/components/forms/TextField";
import { FormAlert } from "@/components/forms/FormAlert";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { authContent } from "@/data/auth-content";
import { authApi } from "../api";
import { applyServerErrors } from "../errors";
import { forgotPasswordSchema, type ForgotPasswordValues } from "../schemas";
import { AuthHeader } from "./AuthHeader";

const copy = authContent.forgotPassword;

function BackToLogin() {
  return (
    <Link href="/login" className="group mt-8 flex items-center justify-center gap-2 text-sm text-muted transition-colors hover:text-white">
      <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
      {copy.back}
    </Link>
  );
}

export function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });

  const onSubmit = handleSubmit(async ({ email }) => {
    setFormError(null);
    try {
      await authApi.forgotPassword({ email });
      setSentTo(email);
    } catch (error) {
      setFormError(applyServerErrors(error, setError, ["email"]) || null);
    }
  });

  if (sentTo) {
    const [before, after] = copy.sentDescription.split("{email}");
    return (
      <div role="status">
        <span className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-accent/15 text-accent-bright ring-1 ring-accent/30">
          <MailCheck className="size-7" strokeWidth={1.5} />
        </span>
        <AuthHeader
          title={copy.sentTitle}
          description={
            <>
              {before}
              <span className="text-white">{sentTo}</span>
              {after}
            </>
          }
        />
        <button
          type="button"
          onClick={() => {
            reset();
            setSentTo(null);
          }}
          className="glass-pill h-[52px] w-full rounded-full text-body text-white transition hover:brightness-125"
        >
          {copy.resend}
        </button>
        <BackToLogin />
      </div>
    );
  }

  return (
    <>
      <AuthHeader title={copy.title} description={copy.description} />
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {formError && <FormAlert>{formError}</FormAlert>}
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
        <SubmitButton loading={isSubmitting} loadingText={copy.submitting} className="mt-2">
          {copy.submit}
        </SubmitButton>
      </form>
      <BackToLogin />
    </>
  );
}

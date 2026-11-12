"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Globe, Layers, Mail, MapPin } from "lucide-react";
import { TextField } from "@/components/forms/TextField";
import { SelectField } from "@/components/forms/SelectField";
import { PasswordField } from "@/components/forms/PasswordField";
import { PasswordStrength } from "@/components/forms/PasswordStrength";
import { Checkbox } from "@/components/forms/Checkbox";
import { FormAlert } from "@/components/forms/FormAlert";
import { SubmitButton } from "@/components/forms/SubmitButton";
import { ApiError } from "@/lib/api/client";
import { authContent } from "@/data/auth-content";
import { useAuth } from "../AuthProvider";
import { applyServerErrors } from "../errors";
import { signupSchema, type SignupValues } from "../schemas";
import { AuthHeader } from "./AuthHeader";
import { CheckEmailNotice } from "./CheckEmailNotice";

const copy = authContent.signup;

/** Brand registration. Nobody is signed in afterwards: the emailed link has to be opened first. */
export function SignupForm() {
  const { signup } = useAuth();
  const next = useSearchParams().get("next");
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      category: copy.categories[0],
      websiteUrl: "",
      physicalStoreAddress: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });
  const password = useWatch({ control, name: "password" });

  const onSubmit = handleSubmit(async ({ name, category, websiteUrl, physicalStoreAddress, email, password }) => {
    setFormError(null);
    try {
      // true = verification email sent; brands never get a session straight from registering.
      if (await signup({ name, category, websiteUrl, physicalStoreAddress, email, password })) setSentTo(email);
    } catch (error) {
      // 409 = the email or the brand name is already taken; show it on the matching field.
      if (error instanceof ApiError && error.status === 409) {
        setError(/email/i.test(error.message) ? "email" : "name", { type: "server", message: error.message });
        return;
      }
      setFormError(applyServerErrors(error, setError, ["name", "email", "password", "websiteUrl"]) || null);
    }
  });

  if (sentTo) return <CheckEmailNotice email={sentTo} />;

  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <>
      <AuthHeader title={copy.title} description={copy.description} />

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        {formError && <FormAlert>{formError}</FormAlert>}

        <TextField
          label={copy.name.label}
          icon={Building2}
          autoComplete="organization"
          placeholder={copy.name.placeholder}
          hint={copy.name.hint}
          error={errors.name?.message}
          {...register("name")}
        />

        <SelectField label={copy.category.label} icon={Layers} options={copy.categories} error={errors.category?.message} {...register("category")} />

        <TextField
          label={copy.website.label}
          icon={Globe}
          type="url"
          autoComplete="url"
          inputMode="url"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={copy.website.placeholder}
          hint={copy.website.hint}
          error={errors.websiteUrl?.message}
          {...register("websiteUrl")}
        />

        <TextField
          label={copy.address.label}
          icon={MapPin}
          autoComplete="street-address"
          placeholder={copy.address.placeholder}
          hint={copy.address.hint}
          error={errors.physicalStoreAddress?.message}
          {...register("physicalStoreAddress")}
        />

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
        {errors.email?.type === "server" && (
          <p className="-mt-3 text-[13px] text-muted">
            <Link href={loginHref} className="text-accent-bright hover:text-white">
              {copy.switchAction}
            </Link>{" "}
            instead?
          </p>
        )}

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

        <Checkbox
          error={errors.acceptTerms?.message}
          label={
            <>
              {copy.terms.prefix}{" "}
              <Link href="/terms" target="_blank" className="text-white underline-offset-4 hover:underline">
                {copy.terms.terms}
              </Link>{" "}
              {copy.terms.and}{" "}
              <Link href="/disclaimer" target="_blank" className="text-white underline-offset-4 hover:underline">
                {copy.terms.privacy}
              </Link>
            </>
          }
          {...register("acceptTerms")}
        />

        <SubmitButton loading={isSubmitting} loadingText={copy.submitting} className="mt-2">
          {copy.submit}
        </SubmitButton>
      </form>

      <p className="mt-8 text-center text-sm text-muted">
        {copy.switchPrompt}{" "}
        <Link href={loginHref} className="font-medium text-white underline-offset-4 hover:underline">
          {copy.switchAction}
        </Link>
      </p>
    </>
  );
}

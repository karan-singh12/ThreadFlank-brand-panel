// Copy for the authentication pages. Components read only from here.

export const authContent = {
  backToHome: "Back to home",
  legal: { terms: "Terms", privacy: "Disclaimer" },

  showcase: {
    eyebrow: "Threadflank for brands",
    title: ["Let shoppers try", "it on first"],
    description: "List your catalog, launch drops and reach shoppers who see every piece on themselves before they buy.",
    pills: ["Virtual try-on", "Your own store link", "Launch drops"],
    testimonial: {
      quote: "Shoppers drape your pieces on their own twin, then head straight to your website to buy.",
      name: "Threadflank",
      handle: "Brand panel",
      image: "",
      tone: "violet",
    },
  },

  login: {
    title: "Brand sign in",
    description: "Log in to manage your catalog, drops and store.",
    email: { label: "Work email", placeholder: "name@yourbrand.com" },
    password: { label: "Password", placeholder: "Enter your password" },
    forgot: "Forgot password?",
    submit: "Log in",
    submitting: "Logging in…",
    invalidCredentials: "That email and password combination doesn't match our records.",
    switchPrompt: "New to Threadflank?",
    switchAction: "Register your brand",
  },

  signup: {
    title: "Register your brand",
    description: "Tell us about your brand. You'll verify your email, and our team reviews it before shoppers can see it.",
    planPrefix: "Selected plan",
    name: { label: "Brand name", placeholder: "e.g. Raw Mango", hint: "Shown to shoppers. You can change it later." },
    category: { label: "Category" },
    categories: ["Ethnic Wear", "Western Wear", "Indo-Western", "Menswear", "Womenswear", "Streetwear", "Footwear & Accessories", "Jewellery", "Other"],
    website: { label: "Website", placeholder: "https://yourbrand.com", hint: "Optional. Where shoppers land when they tap Buy." },
    address: { label: "Flagship store address", placeholder: "Street, area, city", hint: "Optional. Leave empty if you sell online only." },
    email: { label: "Work email", placeholder: "name@yourbrand.com" },
    password: { label: "Password", placeholder: "Create a password", hint: "At least 8 characters with a letter and a number." },
    confirmPassword: { label: "Confirm password", placeholder: "Repeat your password" },
    terms: { prefix: "I agree to the", terms: "Terms & conditions", and: "have read the", privacy: "Disclaimer" },
    submit: "Register brand",
    submitting: "Registering…",
    switchPrompt: "Already registered?",
    switchAction: "Log in",
  },

  verifyEmail: {
    verifyingTitle: "Verifying your email…",
    successTitle: "Email verified",
    successDescription: "Your email is confirmed. You can now log in and set up your brand.",
    successAction: "Continue to log in",
    invalidTitle: "Link expired",
    invalidDescription: "This verification link is invalid or has expired. Log in to request a new one.",
    invalidAction: "Back to log in",
  },

  checkEmail: {
    title: "Verify your email",
    description: "We sent a verification link to {email}. Open it to activate your account. The link expires in 24 hours.",
    reviewNote: "After you verify, you can log in and set up your catalog right away. Your brand appears to shoppers once our team approves it.",
    resend: "Resend email",
    resending: "Sending…",
    resent: "If the account still needs verifying, a new link is on its way.",
    back: "Back to log in",
    notVerified: "Please verify your email before logging in.",
  },

  forgotPassword: {
    title: "Reset your password",
    description: "Enter the email you signed up with and we'll send you a link to reset your password.",
    email: { label: "Email", placeholder: "name@company.com" },
    submit: "Send reset link",
    submitting: "Sending…",
    sentTitle: "Check your inbox",
    sentDescription: "If an account exists for {email}, a password reset link is on its way. The link expires in 30 minutes.",
    resend: "Use a different email",
    back: "Back to log in",
  },

  resetPassword: {
    title: "Choose a new password",
    description: "Pick a strong password you haven't used before.",
    password: { label: "New password", placeholder: "Create a password", hint: "At least 8 characters with a letter and a number." },
    confirmPassword: { label: "Confirm new password", placeholder: "Repeat your password" },
    submit: "Update password",
    submitting: "Updating…",
    invalidLink: "This reset link is invalid or has expired. Request a new one to continue.",
    requestNew: "Request a new link",
    doneTitle: "Password updated",
    doneDescription: "Your password has been changed. You can now log in with your new password.",
    back: "Back to log in",
  },
};

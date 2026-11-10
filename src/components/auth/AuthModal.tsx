"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Lock, Mail, ArrowRight, Sparkles, X, AlertCircle, Loader2 } from "lucide-react";
import { loginBrand } from "@/lib/api";
import type { BrandProfile } from "@/types";

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onLoginSuccess: (brand: BrandProfile, token: string) => void;
  canDismiss?: boolean;
}

export function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  canDismiss = false,
}: AuthModalProps) {
  const [email, setEmail] = useState("atelier@rawmango.com");
  const [password, setPassword] = useState("luxury2026");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await loginBrand(email, password);
      onLoginSuccess(res.brand, res.token);
      if (onClose) onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Invalid brand credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail("atelier@rawmango.com");
    setPassword("luxury2026");
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await loginBrand("atelier@rawmango.com", "luxury2026");
      onLoginSuccess(res.brand, res.token);
      if (onClose) onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to initialize demo atelier.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-3xl bg-[#08091a] border border-white/12 p-6 sm:p-8 space-y-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative">
        {canDismiss && onClose && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full text-muted hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        )}

        {/* Brand Emblem */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="relative size-14 rounded-2xl overflow-hidden ring-1 ring-white/20 shadow-lg bg-white/[0.05] flex items-center justify-center">
            <Image
              src="/logo-emblem.webp"
              alt="ThreadFlank"
              fill
              className="object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>

          <div className="pt-1">
            <h2 className="text-xl font-bold tracking-tight text-white">
              Thread<span className="text-[#7c5cff]">Flank</span> Atelier
            </h2>
            <p className="text-xs text-muted mt-1">
              Sign in to manage your digital twin showroom, catalogs, and runway bids.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-muted block">
              Atelier Work Email
            </label>
            <div className="relative">
              <Mail className="size-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="atelier@brand.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-muted/60 focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-mono uppercase tracking-wider text-muted block">
              Security Key / Password
            </label>
            <div className="relative">
              <Lock className="size-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder:text-muted/60 focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 rounded-xl text-xs font-semibold cursor-pointer active:scale-98 transition-all flex items-center justify-center gap-2 mt-2 shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Authenticating Atelier...</span>
              </>
            ) : (
              <>
                <span>Sign In to Atelier</span>
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-white/8 w-full" />
          <span className="bg-[#08091a] px-3 text-[10px] uppercase font-mono text-muted/70 shrink-0">
            Or Demo Partner Access
          </span>
        </div>

        {/* Instant Demo Button */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-white/90 font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Sparkles className="size-3.5 text-accent-bright" />
          <span>Continue as Raw Mango Atelier (Instant Demo)</span>
        </button>
      </div>
    </div>
  );
}

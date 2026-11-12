"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import { writeSession } from "@/features/auth/storage";
import type { AuthUser } from "@/features/auth/types";
import { ApiError, apiRequest } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/config";
import { BACKGROUNDS } from "@/data/studio-content";
import { socialApi, type CircleMemberRow, type CircleState, type ProfileMemberInput } from "@/features/social/api";
import { useLocalStore } from "./local-store";
import { workspaceApi, type Look, type TwinInput, type TwinProfile, type WardrobeItem } from "./api";

/** A circle member as the UI sees it (managed profile or linked friend). */
export type CircleMember = {
  id: string;
  kind: "PROFILE" | "USER";
  status: "INVITED" | "ACTIVE" | "DECLINED";
  userId?: string;
  name: string;
  relation: string;
  gender: string;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  skinTone?: string;
  /** Source photo of the real person (relative upload path); resolve with `assetUrl`. */
  photo?: string;
  /** Generated full-body persistent twin, reused for every try-on. */
  twin?: string;
};

/** Anyone an outfit can be draped on: you, or a circle member. */
export type Person = {
  id: string;
  name: string;
  relation: string;
  isSelf: boolean;
  gender?: string;
  age?: number;
  heightCm?: number;
  weightKg?: number;
  skinTone?: string;
  photo?: string;
  twin?: string;
};

/** A Drape scene: admin-curated on the server, with built-in presets as a fallback. */
export type StudioScene = {
  id: string;
  name: string;
  category: string;
  imageUrl?: string | null;
  cssGradient?: string | null;
  isDefault?: boolean;
};

/** The image a try-on dresses: the persistent twin when there is one, else the raw photo. */
/** The person's selfie: Drape renders them from it (face) plus their body details. */
export const baseImage = (p?: Person) => p?.photo;

export const SELF_ID = "me";

export const FALLBACK_SCENES: StudioScene[] = [];

const DEFAULT_PREFS: { background: string } = { background: "studio" };
type LegacyMember = { id: string; name: string; relation: string; gender?: string; age?: number; heightCm?: number; weightKg?: number; skinTone?: string; photo?: string; twin?: string };
const NO_LEGACY: LegacyMember[] = [];

export function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : "Something went wrong. Please try again.";
}

/** Loads a list from the API for the signed-in user and exposes a setter for optimistic edits. */
function useApiList<T>(load: (token: string) => Promise<T[]>) {
  const { token } = useAuth();
  const [items, setItems] = useState<T[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    let live = true;
    load(token)
      .then((data) => {
        if (!live) return;
        setItems(data);
        setStatus("ready");
      })
      .catch((e) => {
        if (!live) return;
        setError(errorMessage(e));
        setStatus("error");
      });
    return () => {
      live = false;
    };
  }, [token, load]);

  return { items, setItems, status, error };
}

export const useWardrobe = () => useApiList<WardrobeItem>(workspaceApi.listWardrobe);
export const useLooks = () => useApiList<Look>(workspaceApi.listLooks);

export function useUserProfile() {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<AuthUser | null>(user);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!token) return null;
    setLoading(true);
    setError(null);
    try {
      const liveUser = await workspaceApi.getProfile(token);
      setProfile(liveUser);
      writeSession({ token, user: liveUser });
      return liveUser;
    } catch (e) {
      setError(errorMessage(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    refresh();
  }, [token, refresh]);

  // The session user is kept current by refresh() and by profile edits, so prefer it.
  return { profile: user ?? profile, loading, error, refresh };
}

export function useTwin() {
  const { token } = useAuth();
  const [twin, setTwin] = useState<TwinProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let live = true;
    workspaceApi
      .getTwin(token)
      .then((t) => live && setTwin(t))
      .catch(() => live && setTwin(null))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [token]);

  const save = useCallback(
    async (input: TwinInput) => {
      if (!token) throw new Error("Not signed in");
      const next = await workspaceApi.saveTwin(token, input);
      setTwin(next);
      return next;
    },
    [token]
  );

  return { twin, loading, save };
}

const toMember = (m: CircleMemberRow): CircleMember => ({
  id: m.id,
  kind: m.kind,
  status: m.status,
  userId: m.userId ?? undefined,
  name: m.name,
  relation: m.relation ?? (m.kind === "USER" ? "Friend" : "Family"),
  gender: m.gender ?? "",
  age: m.age ?? undefined,
  heightCm: m.heightCm ?? undefined,
  weightKg: m.weightKg ?? undefined,
  skinTone: m.skinTone ?? undefined,
  photo: m.photo ?? undefined,
  twin: m.twin ?? undefined,
});

/**
 * Your Twin Circle, stored on the server. Members saved in this browser by the
 * earlier local-only version are uploaded once, then the local copy is cleared.
 */
export function useCircle() {
  const { user, token } = useAuth();
  const [state, setState] = useState<CircleState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [legacy, setLegacy] = useLocalStore<LegacyMember[]>(`tf_circle:${user?.id ?? "guest"}`, NO_LEGACY);

  const reload = useCallback(async () => {
    if (!token) return null;
    try {
      const next = await socialApi.circle(token);
      setState(next);
      setError("");
      return next;
    } catch (e) {
      setError(errorMessage(e));
      return null;
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    let live = true;
    socialApi
      .circle(token)
      .then((next) => live && setState(next))
      .catch((e) => live && setError(errorMessage(e)))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [token]);

  // One-time migration of browser-only members.
  useEffect(() => {
    if (!token || !state || legacy.length === 0) return;
    if (state.circle.members.length > 0) {
      setLegacy([]);
      return;
    }
    let cancelled = false;
    (async () => {
      for (const m of legacy.slice(0, state.circle.limit)) {
        if (cancelled) return;
        await socialApi
          .addProfile(token, { name: m.name, relation: m.relation, gender: m.gender, age: m.age, heightCm: m.heightCm, weightKg: m.weightKg, skinTone: m.skinTone, photo: m.photo, twin: m.twin })
          .catch(() => undefined);
      }
      if (!cancelled) {
        setLegacy([]);
        reload();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, state, legacy, setLegacy, reload]);

  const members = useMemo(() => (state?.circle.members ?? []).map(toMember), [state]);

  const run = useCallback(
    async <T,>(fn: (t: string) => Promise<T>) => {
      if (!token) throw new Error("Not signed in");
      const result = await fn(token);
      await reload();
      return result;
    },
    [token, reload]
  );

  return {
    state,
    members,
    limit: state?.circle.limit ?? 5,
    memberships: state?.memberships ?? [],
    loading,
    error,
    reload,
    addProfile: (input: ProfileMemberInput) => run((t) => socialApi.addProfile(t, input)),
    updateMember: (id: string, input: ProfileMemberInput) => run((t) => socialApi.updateMember(t, id, input)),
    removeMember: (id: string) => run((t) => socialApi.removeMember(t, id)),
    invite: (userId: string, relation?: string) => run((t) => socialApi.invite(t, userId, relation)),
    respondInvite: (memberId: string, accept: boolean) => run((t) => socialApi.respondInvite(t, memberId, accept)),
    leave: (circleId: string) => run((t) => socialApi.leaveCircle(t, circleId)),
  };
}

/** Admin-curated Drape scenes, loaded dynamically from the server. */
export function useScenes() {
  const [scenes, setScenes] = useState<StudioScene[]>([]);
  useEffect(() => {
    let active = true;
    apiRequest<StudioScene[]>(ENDPOINTS.studio.backgrounds)
      .then((res) => {
        if (active && res.data) setScenes(res.data);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  return scenes;
}

/**
 * The user's default scene: saved on their twin profile (so it follows them
 * across devices), with a per-browser copy for instant reads.
 */
export function useScenePreference() {
  const { user, token } = useAuth();
  const [prefs, setPrefs] = useLocalStore(`tf_prefs:${user?.id ?? "guest"}`, DEFAULT_PREFS);
  const [serverId, setServerId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let live = true;
    workspaceApi
      .getTwin(token)
      .then((t) => live && t?.backgroundId && setServerId(t.backgroundId))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [token]);

  const current = serverId ?? prefs.background;
  const choose = useCallback(
    async (id: string) => {
      setPrefs({ background: id });
      setServerId(id);
      if (token) await workspaceApi.saveTwin(token, { backgroundId: id }).catch(() => undefined);
    },
    [token, setPrefs]
  );
  return [current, choose] as const;
}

/** You first, then your active circle members, in one list for pickers. */
export function usePeople() {
  const { user } = useAuth();
  const { twin, loading } = useTwin();
  const { members, loading: circleLoading } = useCircle();

  const people = useMemo<Person[]>(() => {
    const self: Person = {
      id: SELF_ID,
      name: user?.username || user?.email.split("@")[0] || "You",
      relation: "You",
      isSelf: true,
      gender: twin?.gender ?? undefined,
      age: twin?.age ?? undefined,
      heightCm: twin?.heightCm ?? undefined,
      weightKg: twin?.weightKg ?? undefined,
      skinTone: twin?.skinTone ?? undefined,
      photo: twin?.selfieUrl || undefined,
      twin: twin?.baseAvatarUrl || undefined,
    };
    const active = members.filter((m) => m.status === "ACTIVE");
    return [self, ...active.map((m) => ({ ...m, isSelf: false }))];
  }, [user, twin, members]);

  return { people, loading: loading || circleLoading };
}

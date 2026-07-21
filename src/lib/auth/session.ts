import "server-only";
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { env } from "@/env";
import { sessionSchema, type SessionPayload } from "@/features/shell/schema";

const COOKIE_NAME = "elemni_session";

const sessionOptions: SessionOptions = {
  password: env.SESSION_SECRET,
  cookieName: COOKIE_NAME,
  cookieOptions: {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  },
};

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(COOKIE_NAME);
    if (!cookie) return null;

    const session = await getIronSession<SessionPayload>(cookieStore, sessionOptions);
    const parsed = sessionSchema.safeParse(session);
    if (!parsed.success) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export async function saveSession(payload: SessionPayload): Promise<void> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionPayload>(cookieStore, sessionOptions);
  Object.assign(session, payload);
  await session.save();
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
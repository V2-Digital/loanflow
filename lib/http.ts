import { NextResponse } from "next/server";

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}
export function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
export function forbidden(message = "Not allowed") {
  return NextResponse.json({ error: message }, { status: 403 });
}
export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

// Coerce/validate a value against an allowed list.
export function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

export function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new ValidationError(`${field} is required`);
  }
  return value.trim();
}

export function optInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export class ValidationError extends Error {}

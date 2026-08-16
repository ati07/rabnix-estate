import { NextResponse } from "next/server";

// Consistent JSON envelope. Error shape mirrors docs/api-contract.md.
export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function fail(
  code: string,
  message: string,
  status = 400,
  fields?: Record<string, string>,
) {
  return NextResponse.json({ error: { code, message, ...(fields ? { fields } : {}) } }, { status });
}

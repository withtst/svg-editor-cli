import { AppError } from "../shared/AppError.js";

export function formatNumber(value: number): string {
  if (Object.is(value, -0)) {
    return "0";
  }

  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
}

export function parseNumber(raw: string, field: string): number {
  const value = Number(raw);
  if (!Number.isFinite(value)) {
    throw new AppError(`invalid number for ${field}: ${raw}`);
  }
  return value;
}

export function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function escapeXmlText(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export function decodeXml(value: string): string {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");
}

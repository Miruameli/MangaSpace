import * as React from "react";
import { safeExternalUrl } from "@/lib/data/mangadex-helpers";

const HR_RE = /^\s*([-*_])(?:\s*\1){2,}\s*$/;

const INLINE_RE_SOURCE = "\\*\\*([\\s\\S]+?)\\*\\*|\\[([^\\]]+)\\]\\(([^)]+)\\)";

export function escapeHtml(input: string): string {
  const value = typeof input === "string" ? input : input == null ? "" : String(input);
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function textToNodes(text: string, keyPrefix: string): React.ReactNode[] {
  const value = typeof text === "string" ? text : text == null ? "" : String(text);
  const lines = value.split("\n");
  const out: React.ReactNode[] = [];
  lines.forEach((line, i) => {
    if (line) out.push(line);
    if (i < lines.length - 1) {
      out.push(React.createElement("br", { key: `${keyPrefix}-br${i}` }));
    }
  });
  return out;
}

function parseInline(text: string, keyPrefix: string): React.ReactNode[] {
  const value = typeof text === "string" ? text : text == null ? "" : String(text);
  const result: React.ReactNode[] = [];
  const re = new RegExp(INLINE_RE_SOURCE, "g");
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(value)) !== null) {
    if (match.index > lastIndex) {
      result.push(
        ...textToNodes(value.slice(lastIndex, match.index), `${keyPrefix}-t${lastIndex}`),
      );
    }
    if (match[1] !== undefined) {
      const inner = parseInline(match[1], `${keyPrefix}-b${match.index}`);
      result.push(
        React.createElement(
          "strong",
          { key: `${keyPrefix}-b${match.index}` },
          ...inner,
        ),
      );
    } else {
      const url = safeExternalUrl(match[3]);
      if (url) {
        result.push(
          React.createElement(
            "a",
            {
              key: `${keyPrefix}-a${match.index}`,
              href: url,
              target: "_blank",
              rel: "noopener noreferrer",
            },
            ...parseInline(match[2], `${keyPrefix}-a${match.index}-t`),
          ),
        );
      } else {
        result.push(
          ...textToNodes(match[0], `${keyPrefix}-x${match.index}`),
        );
      }
    }
    lastIndex = re.lastIndex;
  }
  if (lastIndex < value.length) {
    result.push(...textToNodes(value.slice(lastIndex), `${keyPrefix}-t${lastIndex}`));
  }
  return result;
}

export function parseMarkdown(text: string): React.ReactNode {
  const value = typeof text === "string" ? text : text == null ? "" : String(text);
  const normalized = value.replace(/\r\n?/g, "\n");
  if (!normalized) return null;
  const lines = normalized.split("\n");
  const out: React.ReactNode[] = [];
  let paraLines: string[] = [];
  const flushPara = () => {
    if (paraLines.length === 0) return;
    const joined = paraLines.join("\n");
    const inline = parseInline(joined, `p${out.length}`);
    out.push(React.createElement("p", { key: `p-${out.length}` }, ...inline));
    paraLines = [];
  };
  for (const line of lines) {
    if (line.trim() === "") {
      flushPara();
      continue;
    }
    if (HR_RE.test(line)) {
      flushPara();
      out.push(React.createElement("hr", { key: `hr-${out.length}` }));
      continue;
    }
    paraLines.push(line);
  }
  flushPara();
  if (out.length === 0) return null;
  if (out.length === 1) return out[0];
  return out;
}

function inlineToHtml(text: string): string {
  const value = typeof text === "string" ? text : text == null ? "" : String(text);
  let result = "";
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const re = /\*\*([\s\S]+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  while ((match = re.exec(value)) !== null) {
    result += escapeHtml(value.slice(lastIndex, match.index));
    if (match[1] !== undefined) {
      result += `<strong>${escapeHtml(match[1])}</strong>`;
    } else {
      const url = safeExternalUrl(match[3]);
      if (url) {
        result += `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${inlineToHtml(match[2])}</a>`;
      } else {
        result += escapeHtml(match[0]);
      }
    }
    lastIndex = re.lastIndex;
  }
  result += escapeHtml(value.slice(lastIndex));
  return result;
}

export function markdownToHtml(text: string): string {
  const value = typeof text === "string" ? text : text == null ? "" : String(text);
  const normalized = value.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  const parts: string[] = [];
  let paraLines: string[] = [];
  const flushPara = () => {
    if (paraLines.length === 0) return;
    const inline = paraLines.map((l) => inlineToHtml(l)).join("<br>");
    parts.push(`<p>${inline}</p>`);
    paraLines = [];
  };
  for (const line of lines) {
    if (line.trim() === "") {
      flushPara();
      continue;
    }
    if (HR_RE.test(line)) {
      flushPara();
      parts.push("<hr>");
      continue;
    }
    paraLines.push(line);
  }
  flushPara();
  return parts.join("");
}

export const renderMarkdown = parseMarkdown;
export const markdownToReact = parseMarkdown;
export const toReact = parseMarkdown;
export const toHtml = markdownToHtml;
export const renderMarkdownToHtml = markdownToHtml;

export default parseMarkdown;

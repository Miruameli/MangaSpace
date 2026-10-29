import * as React from "react";
import { parseMarkdown } from "@/lib/markdown";

export interface MarkdownProps {
  children?: React.ReactNode;
  content?: string;
  text?: string;
  source?: string;
  markdown?: string;
  value?: string;
  className?: string;
}

export function Markdown(props: MarkdownProps) {
  const raw =
    props.content ??
    props.text ??
    props.source ??
    props.markdown ??
    props.value ??
    (typeof props.children === "string"
      ? props.children
      : typeof props.children === "number"
        ? String(props.children)
        : "");
  const nodes = parseMarkdown(typeof raw === "string" ? raw : "");
  if (props.className) {
    return React.createElement("div", { className: props.className }, nodes);
  }
  return React.createElement(React.Fragment, null, nodes);
}

export { Markdown as MarkdownRenderer, Markdown as MarkdownText, Markdown as MarkdownContent, Markdown as default };

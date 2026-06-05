import { useState } from "react";

export function useCopyToClipboard(resetDelay = 1500) {
  const [copied, setCopied] = useState(false);

  async function copy(text) {
    const value = String(text || "");

    if (!value) return false;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, resetDelay);

      return true;
    } catch {
      setCopied(false);
      return false;
    }
  }

  return {
    copied,
    copy,
  };
}
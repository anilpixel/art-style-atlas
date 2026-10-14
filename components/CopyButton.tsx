"use client";

import { useState } from "react";

export default function CopyButton({
  text,
  label = "复制提示词",
}: {
  text: string;
  label?: string;
}) {
  const [done, setDone] = useState(false);

  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
        }
        setDone(true);
        setTimeout(() => setDone(false), 1600);
      }}
      className="px-5 h-10 text-sm border border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-700 transition-colors"
    >
      {done ? "已复制 ✓" : label}
    </button>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NextButton() {
  const router = useRouter();
  const [spinning, setSpinning] = useState(false);

  return (
    <button
      onClick={() => {
        setSpinning(true);
        router.refresh();
        setTimeout(() => setSpinning(false), 600);
      }}
      className="px-8 h-12 bg-neutral-900 text-white hover:bg-neutral-700 transition-colors"
    >
      {spinning ? "抽取中…" : "下一个 →"}
    </button>
  );
}

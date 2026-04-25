import { useState } from "react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Color Preview",
  description: "Preview any color using HEX color code.",
};

export default function ColorPreview() {
  const [color, setColor] = useState("#0a66c2");

  return (
    <div className="flex flex-col gap-6">
      {/* TOOL HEADER */}
      <section className="bg-white border rounded-2xl shadow-sm p-6">
        <h1 className="text-3xl font-bold mb-3">Color Preview</h1>
        <p className="text-[var(--text-secondary)]">
          Enter a HEX color code and instantly preview the color.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="bg-white border rounded-2xl shadow-sm p-6">
        <label className="block text-sm font-medium mb-2">
          Enter HEX Color Code
        </label>

        <input
          type="text"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder="#0a66c2"
          className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200 mb-5"
        />

        <div
          className="w-full h-48 rounded-2xl border shadow-inner flex items-center justify-center"
          style={{ backgroundColor: color || "#ffffff" }}
        >
          <span className="bg-white/80 px-4 py-2 rounded-xl text-sm font-medium">
            {color}
          </span>
        </div>
      </section>

      {/* SUGGESTED TOOLS */}
      <SuggestedTools currentToolId="color-preview" />
    </div>
  );
}
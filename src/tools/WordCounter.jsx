import { useState } from "react";
import { Type, Zap, RefreshCw } from "lucide-react";
import SuggestedTools from "../components/sidebar/SuggestedTools";

export const toolData = {
  title: "Word Counter",
  path: "/word-counter",
  category: "Text Tools",
  description:
    "Quickly count words, characters, sentences, and paragraphs in any text.",
  metaTitle: "Word Counter Tool | Count Words, Sentences, Paragraphs Quickly",
  metaDescription:
    "Use the Word Counter tool to quickly count words, characters, sentences, and paragraphs. Just paste your text, and get the count instantly.",
};

export default function WordCounter() {
  const [inputText, setInputText] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [sentenceCount, setSentenceCount] = useState(0);
  const [paragraphCount, setParagraphCount] = useState(0);

  const handleChange = (e) => {
    const text = e.target.value;
    setInputText(text);

    // Update word, char, sentence, and paragraph counts
    const words = text.trim().split(/\s+/).filter(Boolean);
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    const paragraphs = text.split(/\n+/).filter(Boolean);

    setWordCount(words.length);
    setCharCount(text.length);
    setSentenceCount(sentences.length);
    setParagraphCount(paragraphs.length);
  };

  const resetTool = () => {
    setInputText("");
    setWordCount(0);
    setCharCount(0);
    setSentenceCount(0);
    setParagraphCount(0);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* HEADER */}
      <section className="card p-6 sm:p-8">
        <div className="w-14 h-14 rounded-2xl bg-[#f4edff] flex items-center justify-center mb-4">
          <Type size={28} className="text-[var(--primary)]" />
        </div>

        <h1 className="text-3xl font-bold mb-3">Word Counter</h1>

        <p className="text-[var(--text-secondary)] max-w-2xl">
          Quickly count words, characters, sentences, and paragraphs in your
          text. Just paste your content, and get detailed word statistics.
        </p>
      </section>

      {/* TOOL BODY */}
      <section className="card p-6 sm:p-8">
        <div className="grid lg:grid-cols-[1.4fr_0.8fr] gap-6">
          {/* LEFT COLUMN - INPUT AREA */}
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-lg">Enter Your Text</h3>
                <span className="text-xs text-[var(--text-secondary)]">
                  {inputText.length} characters
                </span>
              </div>

              <textarea
                value={inputText}
                onChange={handleChange}
                placeholder="Paste your text here..."
                rows="12"
                className="w-full p-4 border border-[var(--border)] rounded-2xl outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none"
              />
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={resetTool}
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <RefreshCw size={18} />
                Reset
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN - STATS */}
          <div className="flex flex-col gap-5">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <Zap size={20} className="text-[var(--primary)]" />
                <h3 className="font-semibold text-lg">Text Stats</h3>
              </div>
              <span className="text-xs text-[var(--text-secondary)]">
                Total: {wordCount} words
              </span>
            </div>

            <div className="bg-[#f8f4ff] border border-[var(--border)] rounded-2xl p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="text-center">
                  <p className="text-xs text-[var(--text-secondary)]">Words</p>
                  <p className="text-xl font-bold text-[var(--primary)]">
                    {wordCount}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[var(--text-secondary)]">Characters</p>
                  <p className="text-xl font-bold text-[var(--primary)]">
                    {charCount}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[var(--text-secondary)]">Sentences</p>
                  <p className="text-xl font-bold text-[var(--primary)]">
                    {sentenceCount}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[var(--text-secondary)]">Paragraphs</p>
                  <p className="text-xl font-bold text-[var(--primary)]">
                    {paragraphCount}
                  </p>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(inputText);
                }}
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                <Copy size={18} />
                Copy Text
              </button>

              <button
                onClick={() => {
                  const blob = new Blob([inputText], { type: "text/plain" });
                  const link = document.createElement("a");
                  link.href = URL.createObjectURL(blob);
                  link.download = "text.txt";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Download Text
              </button>
            </div>
          </div>
        </div>
      </section>

      <SuggestedTools currentToolId="word-counter" />
    </div>
  );
}
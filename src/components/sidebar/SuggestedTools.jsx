import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import tools from "../../data/tools.json";
import SeoArticle from "../seo/SeoArticle";

const stopWords = new Set([
  "a",
  "an",
  "and",
  "for",
  "from",
  "how",
  "in",
  "into",
  "is",
  "of",
  "on",
  "online",
  "or",
  "the",
  "to",
  "tool",
  "tools",
  "with",
  "your",
  "you"
]);

function extractKeywords(text = "") {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));
}

function getSuggestionScore(currentTool, candidateTool) {
  const currentText = `${currentTool.name} ${currentTool.description} ${currentTool.category}`;
  const candidateText = `${candidateTool.name} ${candidateTool.description} ${candidateTool.category}`;
  const currentKeywords = new Set(extractKeywords(currentText));
  const candidateKeywords = extractKeywords(candidateText);

  let score = 0;
  const sharedKeywords = candidateKeywords.filter((word) => currentKeywords.has(word));

  score += sharedKeywords.length * 2;

  if (currentTool.category === candidateTool.category) {
    score += 5;
  }

  const currentCategory = currentTool.category.toLowerCase();
  const candidateCategory = candidateTool.category.toLowerCase();

  if (currentCategory.includes("image") && candidateCategory.includes("image")) {
    score += 3;
  }

  if (currentCategory.includes("pdf") && candidateCategory.includes("pdf")) {
    score += 3;
  }

  if (currentCategory.includes("audio") && candidateCategory.includes("audio")) {
    score += 3;
  }

  if (currentCategory.includes("video") && candidateCategory.includes("video")) {
    score += 3;
  }

  if (currentCategory.includes("text") && candidateCategory.includes("text")) {
    score += 3;
  }

  if (currentText.includes("convert") && candidateText.includes("convert")) {
    score += 2;
  }

  if (currentText.includes("compress") && candidateText.includes("compress")) {
    score += 2;
  }

  if (currentText.includes("resize") && candidateText.includes("resize")) {
    score += 2;
  }

  if (currentText.includes("pdf") && candidateText.includes("pdf")) {
    score += 2;
  }

  if (currentText.includes("image") && candidateText.includes("image")) {
    score += 2;
  }

  return score;
}

export default function SuggestedTools({ currentToolId }) {
  const currentTool = tools.find((tool) => tool.id === currentToolId);

  const suggestions = currentTool
    ? tools
        .filter((tool) => tool.id !== currentToolId)
        .map((tool) => ({
          ...tool,
          score: getSuggestionScore(currentTool, tool)
        }))
        .filter((tool) => tool.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
    : tools.filter((tool) => tool.id !== currentToolId).slice(0, 6);

  return (
    <>
      <div className="card p-5">
        <h3 className="text-lg font-semibold mb-4">Suggested Tools</h3>

        <div className="flex flex-col gap-2">
          {suggestions.map((tool) => {
            const Icon = Icons[tool.icon] || Icons.Wrench;

            return (
              <Link
                key={tool.id}
                to={`/tool/${tool.id}/`}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#f7f1ff]"
              >
                <div className="w-9 h-9 rounded-xl bg-[#f4edff] flex items-center justify-center shrink-0">
                  <Icon size={17} className="text-[var(--primary)]" />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {tool.name}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] truncate">
                    {tool.category}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <SeoArticle toolId={currentToolId} />
    </>
  );
}
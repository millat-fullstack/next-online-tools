import seoArticles from "../../data/seoArticles";

export default function SeoArticle({ toolId }) {
  const article = seoArticles[toolId];

  if (!article) return null;

  return (
    <div className="card p-5 mt-5">
      <h3 className="text-lg font-semibold mb-4">{article.title}</h3>
      {article.paragraphs.map((paragraph, index) => (
        <p key={index} className="text-sm text-[var(--text-secondary)] leading-7 mb-4">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

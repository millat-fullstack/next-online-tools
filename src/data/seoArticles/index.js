const modules = import.meta.glob("./*.js", { eager: true });

const seoArticles = Object.fromEntries(
  Object.entries(modules).map(([path, module]) => {
    const key = path.replace("./", "").replace(/\.js$/, "");
    return [key, module.default];
  })
);

export default seoArticles;

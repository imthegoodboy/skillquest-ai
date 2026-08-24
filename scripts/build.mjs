import { copyFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { build } from "esbuild";

const root = process.cwd();
const bundle = join(root, "bundle");
const fonts = join(bundle, "fonts");

await rm(bundle, { recursive: true, force: true });
await mkdir(fonts, { recursive: true });

await build({
  entryPoints: [join(root, "src", "app.js")],
  bundle: true,
  outfile: join(bundle, "app.js"),
  format: "esm",
  target: ["es2022"],
  minify: false,
  sourcemap: false,
  legalComments: "none",
});

await Promise.all([
  copyFile(join(root, "src", "index.html"), join(bundle, "index.html")),
  copyFile(join(root, "src", "styles.css"), join(bundle, "styles.css")),
  copyFile(join(root, "src", "logo.svg"), join(bundle, "logo.svg")),
  copyFile(join(root, "node_modules", "@fontsource-variable", "bricolage-grotesque", "files", "bricolage-grotesque-latin-wght-normal.woff2"), join(fonts, "bricolage-grotesque.woff2")),
  copyFile(join(root, "node_modules", "@fontsource-variable", "plus-jakarta-sans", "files", "plus-jakarta-sans-latin-wght-normal.woff2"), join(fonts, "plus-jakarta-sans.woff2")),
]);

console.log("Built SkillQuest AI into bundle/.");

import { readFile, writeFile } from "node:fs/promises";

const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
manifest.ui.views[0].default_size = { w: 390, h: 780 };
await writeFile("manifest.qa-mobile.json", `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

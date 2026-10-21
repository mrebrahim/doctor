#!/usr/bin/env node
// Copy an existing demo as a starting point: node scripts/new-demo.mjs <from-slug> <new-slug>
import fs from "node:fs";
import path from "node:path";
const [from, to] = process.argv.slice(2);
if (!from || !to || !/^[a-z0-9-]+$/.test(to)) { console.error("usage: node scripts/new-demo.mjs <from-slug> <new-slug>   (new-slug: a-z 0-9 -)"); process.exit(1); }
const src = path.join("demos", from), dst = path.join("demos", to);
if (!fs.existsSync(src)) { console.error(`no demo named ${from}`); process.exit(1); }
if (fs.existsSync(dst)) { console.error(`${dst} already exists`); process.exit(1); }
fs.mkdirSync(path.join(dst, "photos"), { recursive: true });
const cfg = JSON.parse(fs.readFileSync(path.join(src, "site.json"), "utf8"));
cfg.siteUrl = `https://${to}.pages.dev`;
fs.writeFileSync(path.join(dst, "site.json"), JSON.stringify(cfg, null, 2) + "\n");
console.log(`created ${dst}/site.json — edit it, put photos in ${dst}/photos/, then: node build.mjs`);

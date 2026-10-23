import fs from "fs";
import path from "path";

const ids = JSON.parse(fs.readFileSync("drive-ids.json", "utf8").replace(/^\uFEFF/, ""));
const byN = Object.fromEntries(ids.filter((x) => x.folder === "A").map((x) => [x.n, x.id]));

const files = [
  ["hero.jpg", 15, "w3840"],
  ["living.jpg", 15, "w2560"],
  ["dining.jpg", 1, "w2560"],
  ["social.jpg", 7, "w2560"],
  ["kitchen-living.jpg", 5, "w2560"],
  ["kitchen.jpg", 11, "w2560"],
  ["office.jpg", 21, "w2560"],
  ["suite.jpg", 24, "w2560"],
  ["closet.jpg", 25, "w2560"],
  ["bath.jpg", 30, "w2560"],
  ["hall.jpg", 23, "w2560"],
  ["nursery.jpg", 36, "w2560"],
  ["kids.jpg", 42, "w2560"],
  ["detail.jpg", 2, "w2560"],
];

const dest = path.resolve("photos");

async function grab(id, size) {
  const url = `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=${size}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${id}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 20000) throw new Error(`tiny ${buf.length}`);
  return buf;
}

for (const [name, n, size] of files) {
  const id = byN[n];
  const buf = await grab(id, size);
  fs.writeFileSync(path.join(dest, name), buf);
  console.log(name, buf.length);
}

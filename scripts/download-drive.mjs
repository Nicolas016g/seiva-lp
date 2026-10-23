import fs from "fs";
import path from "path";

const ids = JSON.parse(fs.readFileSync("drive-ids.json", "utf8"));
const root = path.resolve("fotos");
fs.mkdirSync(path.join(root, "full"), { recursive: true });
fs.mkdirSync(path.join(root, "thumb"), { recursive: true });

async function grab(id, size) {
  const url = `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=${size}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 6000) throw new Error(`tiny ${buf.length}`);
  return buf;
}

let cursor = 0;
const failures = [];

async function worker() {
  while (cursor < ids.length) {
    const item = ids[cursor++];
    const n = String(item.n).padStart(2, "0");
    const base = `${item.folder}-${n}`;
    try {
      const [full, thumb] = await Promise.all([grab(item.id, "w1600"), grab(item.id, "w640")]);
      fs.writeFileSync(path.join(root, "full", `${base}.jpg`), full);
      fs.writeFileSync(path.join(root, "thumb", `${base}.jpg`), thumb);
      console.log("ok", base, full.length);
    } catch (err) {
      console.error("fail", base, err.message);
      failures.push(base);
    }
  }
}

await Promise.all(Array.from({ length: 5 }, () => worker()));
console.log("done", ids.length - failures.length, "ok", failures.length, "fail");
if (failures.length) process.exitCode = 1;

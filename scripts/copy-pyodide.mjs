import fs from "node:fs";
import path from "node:path";

const srcDir = path.resolve("node_modules/pyodide");
const destDir = path.resolve("dist/pyodide");
const files = [
  "pyodide.js",
  "pyodide.asm.js",
  "pyodide.asm.wasm",
  "python_stdlib.zip",
  "pyodide-lock.json",
];

if (fs.existsSync(srcDir)) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of files) {
    const from = path.join(srcDir, file);
    if (fs.existsSync(from)) {
      fs.copyFileSync(from, path.join(destDir, file));
    }
  }
}

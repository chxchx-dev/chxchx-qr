import { spawnSync } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const packageDirectories = ["packages/contracts", "packages/qr-core"];
const outputDirectory = resolve("artifacts/local");

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
function runNpm(args) {
  const result = spawnSync(npm, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

for (const packageDirectory of packageDirectories) {
  await rm(resolve(packageDirectory, "dist"), { recursive: true, force: true });
}

await runNpm(["run", "build:packages"]);
await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });
runNpm([
  "pack",
  "--workspace=packages/contracts",
  "--workspace=packages/qr-core",
  `--pack-destination=${outputDirectory}`,
]);

console.log(`\nPaquetes locales listos en: ${outputDirectory}`);

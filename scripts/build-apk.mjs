#!/usr/bin/env node
/**
 * Build a sideloadable Gloss APK for the Daylight DC-1 (and any Android).
 * Produces /workspace/artifacts/gloss.apk
 */
import { execSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const androidHome = process.env.ANDROID_HOME || join(root, ".android-sdk");

function run(cmd, opts = {}) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { cwd: root, stdio: "inherit", ...opts });
}

process.env.ANDROID_HOME = androidHome;
process.env.ANDROID_SDK_ROOT = androidHome;
process.env.JAVA_HOME = process.env.JAVA_HOME || "/usr/lib/jvm/java-17-openjdk-amd64";
if (!existsSync(process.env.JAVA_HOME)) {
  process.env.JAVA_HOME = "/usr/lib/jvm/java-17-openjdk-amd64";
}

run("npx vite build --config vite.apk.config.ts");

const nested = join(root, "dist-apk", "index.apk.html");
const flat = join(root, "dist-apk", "index.html");
if (existsSync(nested)) {
  let html = readFileSync(nested, "utf8");
  html = html.replaceAll("/src/apk/", "./");
  writeFileSync(flat, html);
}

if (!existsSync(join(root, "android", "app"))) {
  run("npx cap add android");
}
run("npx cap sync android");

const keystore = join(root, "android", "app", "gloss.keystore");
if (!existsSync(keystore)) {
  run(
    [
      "keytool -genkeypair -v",
      `-keystore ${keystore}`,
      "-alias gloss",
      "-keyalg RSA -keysize 2048 -validity 10000",
      "-storepass gloss-dc1 -keypass gloss-dc1",
      '-dname "CN=Gloss, OU=Reader, O=Gloss, L=Santa Clara, ST=CA, C=US"',
    ].join(" "),
  );
}
process.env.GLOSS_KEYSTORE_PASSWORD = process.env.GLOSS_KEYSTORE_PASSWORD || "gloss-dc1";

const apkOut = join(
  root,
  "android",
  "app",
  "build",
  "outputs",
  "apk",
  "release",
  "app-release.apk",
);
run("./gradlew assembleRelease --no-daemon", { cwd: join(root, "android") });

mkdirSync(join(root, "artifacts"), { recursive: true });
const dest = join(root, "artifacts", "gloss.apk");
copyFileSync(apkOut, dest);
console.log(`APK ready: ${dest}`);

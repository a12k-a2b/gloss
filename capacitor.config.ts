import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.gloss.reader",
  appName: "Gloss",
  webDir: "dist-apk",
  backgroundColor: "#f3efe4",
  android: {
    allowMixedContent: false,
    backgroundColor: "#f3efe4",
    webContentsDebuggingEnabled: false,
  },
};

export default config;

import { google } from "googleapis";
import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";
import { getOAuthClient, saveCredentials, loadSavedCredentials } from "@/lib/google";

async function main() {
  const client = await getOAuthClient();
  const existing = await loadSavedCredentials();

  if (existing) {
    console.log("Existing Google OAuth tokens detected. No action taken.");
    return;
  }

  const authUrl = client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/drive.readonly",
    ],
    prompt: "consent",
  });

  console.log("Visit this URL to authorize RADAR (no secrets are logged):\n");
  console.log(authUrl);
  console.log("\nPaste the authorization code below and press enter.\n");

  const rl = readline.createInterface({ input, output });
  const code = (await rl.question("Authorization code: ")).trim();
  rl.close();

  if (!code) {
    console.error("No authorization code provided; aborting token setup.");
    return;
  }

  const { tokens } = await client.getToken(code);
  await saveCredentials(tokens);
  console.log("Tokens stored securely at .data/google-token.json");
}

main().catch((error) => {
  console.error("Failed to complete Google OAuth setup.", error);
  process.exitCode = 1;
});

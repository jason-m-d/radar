import { google } from "googleapis";
import type { Credentials } from "google-auth-library";
import type { OAuth2Client } from "google-auth-library";
import { promises as fs } from "fs";
import path from "path";

const CONFIG_PATH = path.resolve(process.cwd(), "config/google.json");
const TOKEN_PATH = path.resolve(process.cwd(), ".data/google-token.json");

type GoogleAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

let cachedConfig: GoogleAuthConfig | null = null;
let cachedClient: OAuth2Client | null = null;
let cachedTokens: Credentials | null = null;

async function loadConfig(): Promise<GoogleAuthConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  const raw = await fs.readFile(CONFIG_PATH, "utf8");
  const parsed = JSON.parse(raw) as Partial<GoogleAuthConfig> & {
    installed?: Partial<GoogleAuthConfig> & {
      client_id?: string;
      client_secret?: string;
      redirect_uris?: string[];
    };
    client_id?: string;
    client_secret?: string;
    redirect_uris?: string[];
  };

  const source = parsed.installed ?? parsed;

  const clientId = source.clientId ?? source.client_id;
  const clientSecret = source.clientSecret ?? source.client_secret;
  const redirectUri =
    source.redirectUri ?? source.redirect_uris?.[0] ?? parsed.redirect_uris?.[0];

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("config/google.json is missing clientId, clientSecret, or redirectUri");
  }

  cachedConfig = {
    clientId,
    clientSecret,
    redirectUri,
  };

  return cachedConfig;
}

function buildClient(config: GoogleAuthConfig): OAuth2Client {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new google.auth.OAuth2(config.clientId, config.clientSecret, config.redirectUri);
  cachedClient = client;
  return client;
}

export async function getOAuthClient(): Promise<OAuth2Client> {
  const config = await loadConfig();
  return buildClient(config);
}

export async function loadSavedCredentials(): Promise<Credentials | null> {
  if (cachedTokens) {
    return cachedTokens;
  }

  try {
    const raw = await fs.readFile(TOKEN_PATH, "utf8");
    const tokens = JSON.parse(raw) as Credentials;
    cachedTokens = tokens;
    return tokens;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

export async function saveCredentials(tokens: Credentials): Promise<void> {
  await fs.mkdir(path.dirname(TOKEN_PATH), { recursive: true });
  cachedTokens = tokens;
  await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2), "utf8");
}

export const paths = {
  config: CONFIG_PATH,
  token: TOKEN_PATH,
};

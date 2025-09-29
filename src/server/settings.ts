import prisma from "@/lib/db";

const VIP_SETTING_KEY = "vipList";
const CONFIDENCE_SETTING_KEY = "confidence";
const VIP_ONLY_SETTING_KEY = "vipOnly";

const DEFAULT_CONFIDENCE = 0.7;
const DEFAULT_VIP_ONLY = true;

type VipSettingValue = string[];

export type ProcessingConfig = {
  confidence: number;
  vipOnly: boolean;
};

function parseConfidence(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed) && parsed >= 0 && parsed <= 1) {
      return parsed;
    }
  }

  return null;
}

function parseVipOnly(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if (lowered === "true") {
      return true;
    }
    if (lowered === "false") {
      return false;
    }
  }

  return null;
}

export async function getVipList(): Promise<string[]> {
  const setting = await prisma.setting.findUnique({ where: { key: VIP_SETTING_KEY } });
  const raw = setting?.value;

  if (!raw) {
    return [];
  }

  if (Array.isArray(raw)) {
    return raw.filter((entry): entry is string => typeof entry === "string");
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((entry): entry is string => typeof entry === "string")
        : [];
    } catch {
      return [];
    }
  }

  return [];
}

export async function setVipList(vips: VipSettingValue): Promise<void> {
  await prisma.setting.upsert({
    where: { key: VIP_SETTING_KEY },
    update: { value: vips },
    create: { key: VIP_SETTING_KEY, value: vips },
  });
}

export async function getProcessingConfig(): Promise<ProcessingConfig> {
  let confidenceSetting = await prisma.setting.findUnique({ where: { key: CONFIDENCE_SETTING_KEY } });
  if (!confidenceSetting) {
    confidenceSetting = await prisma.setting.create({
      data: { key: CONFIDENCE_SETTING_KEY, value: DEFAULT_CONFIDENCE },
    });
  }

  let vipOnlySetting = await prisma.setting.findUnique({ where: { key: VIP_ONLY_SETTING_KEY } });
  if (!vipOnlySetting) {
    vipOnlySetting = await prisma.setting.create({
      data: { key: VIP_ONLY_SETTING_KEY, value: DEFAULT_VIP_ONLY },
    });
  }

  const confidence = parseConfidence(confidenceSetting.value) ?? DEFAULT_CONFIDENCE;
  const vipOnly = parseVipOnly(vipOnlySetting.value) ?? DEFAULT_VIP_ONLY;

  return { confidence, vipOnly };
}

export async function setProcessingConfig(config: ProcessingConfig): Promise<void> {
  await Promise.all([
    prisma.setting.upsert({
      where: { key: CONFIDENCE_SETTING_KEY },
      update: { value: config.confidence },
      create: { key: CONFIDENCE_SETTING_KEY, value: config.confidence },
    }),
    prisma.setting.upsert({
      where: { key: VIP_ONLY_SETTING_KEY },
      update: { value: config.vipOnly },
      create: { key: VIP_ONLY_SETTING_KEY, value: config.vipOnly },
    }),
  ]);
}

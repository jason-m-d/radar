import prisma from "@/lib/db";

const VIP_SETTING_KEY = "vipList";

type VipSettingValue = string[];

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

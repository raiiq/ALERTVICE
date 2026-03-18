export interface FlagMatch {
  flag: string;
  keywords: string[];
}

export const flagMappings: FlagMatch[] = [
  { flag: "iq", keywords: ["العراق", "بغداد", "بصره", "بابل", "الموصل", "أربيل", "الأنبار", "كربلاء", "النجف", "صلاح الدين", "كركوك", "ميسان", "الناصرية", "السليمانية", "دهوك"] },
  { flag: "ir", keywords: ["إيران", "طهران", "أصفهان", "مشهد", "شيراز", "تبريز", "خوزستان", "قم", "الأهواز"] },
  { flag: "sa", keywords: ["السعودية", "الرياض", "جدة", "مكة", "المدينة", "الدمام", "تبوك", "الطائف"] },
  { flag: "il", keywords: ["إسرائيل", "تل أبيب", "حيفا", "يافا", "إيلات", "الاحتلال الإسرائيلي"] },
  { flag: "lb", keywords: ["لبنان", "بيروت", "صيدا", "طرابلس", "صور", "الضاحية", "البقاع", "بعلبك", "جنوب لبنان", "النبطية"] },
  { flag: "qa", keywords: ["قطر", "الدوحة"] },
  { flag: "bh", keywords: ["البحرين", "المنامة"] },
  { flag: "kw", keywords: ["الكويت", "الجهراء"] },
  { flag: "om", keywords: ["عمان", "مسقط", "صلالة"] },
  { flag: "sy", keywords: ["سوريا", "دمشق", "حلب", "حمص", "حماة", "إدلب", "دير الزور", "الرقة", "درعا", "اللاذقية", "طرطوس"] },
  { flag: "jo", keywords: ["الأردن", "عمان", "الزرقاء", "إربد", "العقبة"] },
  { flag: "ps", keywords: ["فلسطين", "غزة", "الضفة", "رام الله", "نابلس", "جنين", "رفح", "خان يونس", "القدس", "طولكرم", "الخليل"] },
  { flag: "us", keywords: ["قاعدة عين الأسد", "حرير", "التنف", "الشدادي", "العمر", "قاعدة البرج 22", "قاعدة فيكتوريا", "القوات الأمريكية", "الولايات المتحدة", "واشنطن", "امريكا", "أمريكا"] }
];

export function extractFlags(text: string): string[] {
  if (!text) return [];
  const normalizedText = text.toLowerCase();
  const matchedFlags = new Set<string>();

  for (const mapping of flagMappings) {
    for (const keyword of mapping.keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        matchedFlags.add(mapping.flag);
        break; // Found a match for this flag, avoid duplicates of the same flag
      }
    }
  }

  return Array.from(matchedFlags);
}

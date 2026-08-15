/** Short Hindi + English labels for catalogue BNS sections (indicative). */
const BNS_DHARA: Record<string, { en: string; hi: string }> = {
  "75": { en: "Sexual harassment", hi: "यौन उत्पीड़न" },
  "85": { en: "Cruelty by husband or relatives", hi: "पति/रिश्तेदार द्वारा क्रूरता" },
  "86": { en: "Cruelty — related provisions", hi: "क्रूरता संबंधी प्रावधान" },
  "115": { en: "Voluntarily causing hurt", hi: "स्वेच्छा से चोट पहुँचाना" },
  "117": { en: "Voluntarily causing grievous hurt", hi: "गंभीर चोट पहुँचाना" },
  "137": { en: "Kidnapping / related", hi: "अपहरण संबंधी" },
  "270": { en: "Public nuisance", hi: "लोक न्यूसेंस" },
  "303": { en: "Theft", hi: "चोरी" },
  "309": { en: "Robbery / snatching related", hi: "लूट / छीनना संबंधी" },
  "316": { en: "Criminal breach of trust", hi: "न्यास भंग" },
  "318": { en: "Cheating", hi: "धोखाधड़ी" },
  "324": { en: "Mischief", hi: "मिस्चीफ / नुकसान" },
  "331": { en: "House-breaking / house trespass related", hi: "सेंधमारी / गृह अतिचार" },
  "336": { en: "Forgery / false document related", hi: "जालसाजी संबंधी" },
  "337": { en: "Forgery for cheating related", hi: "धोखा हेतु जालसाजी" },
  "351": { en: "Criminal intimidation", hi: "आपराधिक धमकी" },
};

export function formatDhara(section: string): {
  section: string;
  en: string;
  hi: string;
  label: string;
} {
  const key = section.replace(/^§\s*/i, "").trim();
  const meta = BNS_DHARA[key];
  if (!meta) {
    return {
      section: key,
      en: "As per BNS (station to confirm)",
      hi: "बीएनएस अनुसार (थाना पुष्टि करेगा)",
      label: `BNS धारा ${key}`,
    };
  }
  return {
    section: key,
    en: meta.en,
    hi: meta.hi,
    label: `BNS धारा ${key} — ${meta.hi} (${meta.en})`,
  };
}

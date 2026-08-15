import Image from "next/image";
import { ModeShell } from "@/components/ModeShell";

export default function HomePage() {
  return (
    <main className="force-light mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <section className="hero-panel relative mb-6 min-h-[320px]">
        <Image
          src="/hero-station.jpg"
          alt="पुलिस स्टेशन नागरिक सेवा काउंटर"
          fill
          className="object-cover"
          priority
          sizes="(max-width: 1200px) 100vw, 1152px"
        />
        <div className="hero-content relative z-[1] grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.35fr_0.9fr] lg:p-10">
          <div className="text-white">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--gold)]/40 bg-black/25 px-3 py-1 text-[11px] font-bold tracking-[0.12em] text-[var(--gold-bright)] backdrop-blur-sm">
              <Image
                src="/chakra-icon.jpg"
                alt=""
                width={16}
                height={16}
                className="h-4 w-4 rounded-full object-cover"
              />
              🇮🇳 15 अगस्त · स्वतंत्रता दिवस · शिकायत पूर्व-प्रक्रिया
            </div>
            <h2 className="max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              थाने में जमा करने हेतु पुलिस शिकायत का मसौदा तैयार करें
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
              शिकायतकर्ता के विवरण और घटना के तथ्य हिंदी या अंग्रेज़ी में दर्ज करें। प्रणाली
              औपचारिक मसौदा तैयार करती है; आपका बयान आपके शब्दों में सुरक्षित रहता है, जिसे आप थाने
              में प्रस्तुत कर सकते हैं।
            </p>

            <div className="mt-6 grid max-w-lg grid-cols-3 gap-2">
              {[
                { n: "०१", t: "तथ्य दर्ज करें" },
                { n: "०२", t: "मसौदा जाँचें" },
                { n: "०३", t: "थाने में जमा करें" },
              ].map((s) => (
                <div
                  key={s.n}
                  className="rounded-lg border border-white/20 bg-white/10 px-2 py-3 text-center backdrop-blur-sm"
                >
                  <div className="font-mono text-xs font-bold text-[var(--gold-bright)]">{s.n}</div>
                  <div className="mt-1 text-xs font-semibold text-white sm:text-sm">{s.t}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/15 bg-[var(--navy)]/75 p-5 text-white shadow-xl backdrop-blur-md">
            <div className="mb-3 flex items-center gap-3">
              <Image
                src="/police-badge.jpg"
                alt=""
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-[var(--gold)]"
              />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--gold-bright)]">
                  आवश्यक जानकारी
                </p>
                <p className="text-sm text-white/80">निम्न तैयार रखें</p>
              </div>
            </div>
            <ul className="space-y-2.5 text-sm text-white/90">
              {[
                "शिकायतकर्ता का पूरा नाम और मोबाइल नंबर",
                "घटना की तिथि, समय और स्थान",
                "थाने का नाम (यदि ज्ञात हो) व जिले का विवरण",
                "घटना का विस्तृत बयान — अपने शब्दों में",
                "अभियुक्त का नाम, यदि ज्ञात हो; अन्यथा अज्ञात",
              ].map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--gold-bright)]" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-lg border border-[var(--gold)]/30 bg-black/20 px-3 py-2.5 text-sm">
              <span className="font-bold text-[var(--gold-bright)]">आपातकाल:</span>{" "}
              <span>तत्काल पुलिस सहायता के लिए 112 डायल करें।</span>
            </div>
          </div>
        </div>
      </section>

      <section className="portal-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--line)] bg-gradient-to-r from-[#f7f9fc] to-white px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2.5">
            <Image
              src="/police-badge.jpg"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-cover"
            />
            <div>
              <h3 className="text-sm font-bold text-[var(--navy)]">शिकायत पंजीकरण डेस्क</h3>
              <p className="text-[11px] text-slate-500">
                मौखिक या लिखित बयान · थाने हेतु मसौदा
              </p>
            </div>
          </div>
          <span className="rounded-full border border-[var(--gold)]/40 bg-[var(--gold-soft)] px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#6b5208]">
            आधिकारिक सत्र · जय हिंद
          </span>
        </div>
        <ModeShell />
      </section>
    </main>
  );
}

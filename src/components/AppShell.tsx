import Image from "next/image";
import Link from "next/link";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="force-light flex min-h-full flex-col portal-shell">
      <div className="tricolor-bar no-print" />

      <header className="premium-header no-print">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3.5 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-3.5">
            <Image
              src="/police-badge.jpg"
              alt="पुलिस शिकायत सहायता प्रतीक"
              width={64}
              height={64}
              className="badge-glow h-14 w-14 rounded-full object-cover sm:h-16 sm:w-16"
              priority
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Image
                  src="/chakra-icon.jpg"
                  alt=""
                  width={18}
                  height={18}
                  className="hidden h-4 w-4 rounded-full object-cover sm:block"
                />
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--gold-bright)] sm:text-xs">
                  भारत सरकार · नागरिक पोर्टल · 🇮🇳 15 अगस्त
                </p>
              </div>
              <h1 className="truncate text-xl font-bold tracking-tight text-white sm:text-2xl">
                पुलिस शिकायत सहायता
              </h1>
              <p className="truncate text-xs text-white/75 sm:text-sm">
                Police Complaint Assist · थाने में प्रस्तुत करने हेतु मसौदा
              </p>
            </div>
          </Link>

          <div className="ml-auto hidden text-right md:block">
            <p className="text-sm font-bold text-[var(--gold-bright)]">आपातकालीन हेल्पलाइन: 112</p>
            <p className="text-xs text-white/70">केवल थाने में जमा करने हेतु</p>
          </div>
        </div>

        <div className="border-t border-white/10 bg-black/20">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2 text-xs text-white/85 sm:px-6">
            <span className="font-semibold text-[var(--gold-bright)]">ई-शिकायत मसौदा</span>
            <span>हिंदी / अंग्रेज़ी · आवाज़ व लिखित</span>
            <span>प्रिंट योग्य शिकायत</span>
            <span className="ml-auto hidden sm:inline">यह FIR पंजीकरण नहीं है</span>
          </div>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="no-print mt-auto border-t border-[var(--navy)] bg-[var(--navy)] text-white">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 py-6 text-xs leading-relaxed sm:grid-cols-3 sm:px-6">
          <div>
            <p className="mb-1.5 text-sm font-bold text-[var(--gold-bright)]">कानूनी अस्वीकरण</p>
            <p className="text-white/80">
              यह पोर्टल केवल <strong className="text-white">शिकायत का मसौदा</strong> बनाता है। यह
              ऑनलाइन FIR दर्ज नहीं करता, न जाँच शुरू करता है, न कोई पुलिस रिकॉर्ड बनाता है।
            </p>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-bold text-[var(--gold-bright)]">तथ्यों का कथन</p>
            <p className="text-white/80">
              शिकायतकर्ता का बयान यथावत सुरक्षित रखा जाता है। सुझाई गई धाराएँ सांकेतिक हैं; अंतिम
              निर्णय थाने के अधिकारी का होगा।
            </p>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-bold text-[var(--gold-bright)]">आपातकालीन सहायता</p>
            <p className="text-white/80">
              जीवन या संपत्ति को तत्काल खतरा हो तो तुरंत{" "}
              <span className="text-lg font-bold text-white">112</span> पर कॉल करें। आपात स्थिति में
              इस पोर्टल पर निर्भर न रहें।
            </p>
          </div>
        </div>
        <div className="border-t border-white/10 py-3 text-center text-[11px] text-white/50">
          पुलिस शिकायत सहायता · नागरिक ई-सेवा · जय हिंद · स्वतंत्रता दिवस 🇮🇳
        </div>
      </footer>
    </div>
  );
}

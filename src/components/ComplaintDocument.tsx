"use client";

import type { ComplaintRecord } from "@/lib/types";
import { formatDhara } from "@/lib/bns-labels";
import { getServiceContacts } from "@/lib/service-contacts";

export function ComplaintDocument({ complaint }: { complaint: ComplaintRecord }) {
  const contacts = getServiceContacts();
  const dharas =
    complaint.offence.bnsSections.length > 0
      ? complaint.offence.bnsSections.map(formatDhara)
      : [];

  const stationLine = [
    complaint.policeStation,
    complaint.policeStationDistrict
      ? `जिला ${complaint.policeStationDistrict}`
      : null,
    complaint.policeStationState,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="complaint-doc mx-auto max-w-3xl space-y-8 bg-white text-slate-900">
      <header className="border-b-2 border-[var(--navy)] pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[var(--gold)] bg-[var(--navy)] text-[9px] font-bold leading-tight text-[var(--gold)]">
            POLICE
            <br />
            INDIA
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] text-[var(--navy-mid)]">
              🇮🇳 केवल थाने में प्रस्तुत करने हेतु · स्वतंत्रता दिवस
            </p>
            <h1 className="text-xl font-bold text-[var(--navy)] sm:text-2xl">
              आवेदन / शिकायत
            </h1>
            <p className="mt-1 text-xs text-slate-600">
              नागरिक द्वारा तैयार मसौदा शिकायत। यह FIR नहीं है। पंजीकरण, संज्ञेयता व जाँच का निर्णय
              केवल ड्यूटी अधिकारी का होगा।
            </p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 border border-[#c5cedd] bg-[#f7f9fc] px-3 py-2 text-xs text-slate-600 sm:grid-cols-3">
          <div>
            <dt className="font-semibold text-slate-800">संदर्भ संख्या</dt>
            <dd className="font-mono">{complaint.token}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-800">तैयारी तिथि</dt>
            <dd>{new Date(complaint.createdAt).toLocaleString("hi-IN")}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-800">भाषा</dt>
            <dd>{complaint.language === "en" ? "अंग्रेज़ी / मिश्रित" : "हिंदी / मिश्रित"}</dd>
          </div>
        </dl>
      </header>

      <section className="space-y-2">
        <h2 className="border-b border-[var(--navy)] pb-1 text-base font-bold text-[var(--navy)]">
          थाना / पुलिस स्टेशन विवरण
        </h2>
        <table className="w-full border-collapse border border-[#c5cedd] text-sm">
          <tbody>
            <Row
              label="थाना"
              value={stationLine || "क्षेत्राधिकार थाना (काउंटर पर पुष्टि)"}
            />
            <Row label="थाने का संपर्क" value={complaint.policeStationPhone} />
            <Row
              label="घटना स्थल / तिथि / समय"
              value={[complaint.occurrencePlace, complaint.occurrenceDate, complaint.occurrenceTime]
                .filter(Boolean)
                .join(" · ")}
            />
          </tbody>
        </table>
      </section>

      <section className="space-y-2">
        <h2 className="border-b border-[var(--navy)] pb-1 text-base font-bold text-[var(--navy)]">
          संबंधित प्रावधान / धाराएँ (बीएनएस)
        </h2>
        <div className="rounded border border-[var(--navy)]/30 bg-[#f3f6fb] p-4">
          <p className="text-[10px] font-bold tracking-wider text-[var(--navy-mid)]">
            अनंतिम अपराध का स्वरूप
          </p>
          <p className="mt-1 text-lg font-bold text-[var(--navy)]">
            {complaint.offence.nameHi}
            <span className="ml-2 text-base font-semibold text-slate-700">
              ({complaint.offence.nameEn})
            </span>
          </p>
          {complaint.offence.severityNote ? (
            <p className="mt-1 text-xs text-slate-600">{complaint.offence.severityNote}</p>
          ) : null}
        </div>

        {dharas.length > 0 ? (
          <table className="w-full border-collapse border border-[#c5cedd] text-sm">
            <thead>
              <tr className="bg-[var(--navy)] text-left text-xs text-white">
                <th className="px-3 py-2 font-semibold">धारा / Section</th>
                <th className="px-3 py-2 font-semibold">विवरण (हिंदी)</th>
                <th className="px-3 py-2 font-semibold">Description (English)</th>
              </tr>
            </thead>
            <tbody>
              {dharas.map((d) => (
                <tr key={d.section} className="border-b border-[#c5cedd]">
                  <td className="px-3 py-2 font-mono font-bold text-[var(--navy)]">
                    बीएनएस धारा {d.section}
                  </td>
                  <td className="px-3 py-2">{d.hi}</td>
                  <td className="px-3 py-2">{d.en}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            उच्च विश्वास से कोई सूचीबद्ध धारा नहीं मिली। स्टेशन हाउस अधिकारी तथ्यों की जाँच के बाद
            उचित धाराएँ अंकित करेंगे।
          </p>
        )}
        <p className="text-[11px] text-slate-500">
          उपर्युक्त धाराएँ कंप्यूटर-सुझाव हैं और <strong>बाध्यकारी नहीं</strong>। अंतिम धाराएँ, यदि
          कोई हों, केवल पुलिस द्वारा दर्ज की जाएँगी।
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="border-b border-[var(--navy)] pb-1 text-base font-bold text-[var(--navy)]">
          शिकायतकर्ता के विवरण
        </h2>

        <table className="w-full border-collapse border border-[#c5cedd] text-sm">
          <tbody>
            <Row label="शिकायतकर्ता" value={complaint.complainantName} />
            <Row label="अभिभावक / पति-पत्नी" value={complaint.parentage} />
            <Row
              label="आयु / लिंग"
              value={[complaint.age, complaint.gender].filter(Boolean).join(" / ")}
            />
            <Row label="पता" value={complaint.complainantAddress} />
            <Row label="मोबाइल" value={complaint.complainantPhone} />
            <Row label="अभियुक्त" value={complaint.accused || "अज्ञात / पूर्ण रूप से पहचाना नहीं"} />
            <Row label="गवाह" value={complaint.witnesses} />
            <Row label="चोट / हानि" value={complaint.injuryOrLoss} />
            <Row label="प्रार्थना / राहत" value={complaint.reliefSought} />
          </tbody>
        </table>

        <div>
          <h3 className="text-xs font-bold tracking-wide text-slate-600">मामले के संक्षिप्त तथ्य</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-800">{complaint.formalSummary}</p>
        </div>

        {complaint.verbatimAccount?.trim() ? (
          <div>
            <h3 className="text-xs font-bold tracking-wide text-slate-600">
              शिकायतकर्ता द्वारा बताए गए तथ्य
            </h3>
            <div className="mt-2 rounded border border-[#c5cedd] bg-[#fafbfc] p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-900">
                {complaint.verbatimAccount}
              </p>
            </div>
          </div>
        ) : null}

        <div className="grid gap-6 pt-8 sm:grid-cols-2">
          <div>
            <p className="text-sm">शिकायतकर्ता के हस्ताक्षर / अंगूठा</p>
            <div className="mt-8 border-b border-slate-800" />
          </div>
          <div>
            <p className="text-sm">दिनांक व स्थान</p>
            <div className="mt-8 border-b border-slate-800" />
          </div>
        </div>
      </section>

      <section className="space-y-2 rounded border-2 border-[var(--navy)] p-4">
        <h2 className="text-base font-bold text-[var(--navy)]">
          आगे की जानकारी हेतु संपर्क
        </h2>
        <table className="w-full border-collapse text-sm">
          <tbody>
            <tr className="border-b border-[#c5cedd]">
              <th className="w-44 py-2 pr-3 text-left text-xs font-semibold text-slate-600">
                मसौदा सहायता डेस्क
              </th>
              <td className="py-2 font-semibold text-slate-900">{contacts.assistantName}</td>
            </tr>
            <tr className="border-b border-[#c5cedd]">
              <th className="py-2 pr-3 text-left text-xs font-semibold text-slate-600">
                सहायक हेल्पलाइन
              </th>
              <td className="py-2">
                <a
                  href={`tel:${contacts.assistantPhone.replace(/\s/g, "")}`}
                  className="font-mono text-base font-bold text-[var(--navy)] underline"
                >
                  {contacts.assistantPhone}
                </a>
                <span className="mt-0.5 block text-xs text-slate-500">{contacts.assistantHours}</span>
              </td>
            </tr>
            {complaint.policeStationPhone ? (
              <tr className="border-b border-[#c5cedd]">
                <th className="py-2 pr-3 text-left text-xs font-semibold text-slate-600">
                  थाने का फोन
                </th>
                <td className="py-2 font-mono font-bold">{complaint.policeStationPhone}</td>
              </tr>
            ) : null}
            <tr className="border-b border-[#c5cedd]">
              <th className="py-2 pr-3 text-left text-xs font-semibold text-slate-600">
                पुलिस आपातकाल
              </th>
              <td className="py-2 font-mono font-bold">{contacts.controlRoom}</td>
            </tr>
            <tr className="border-b border-[#c5cedd]">
              <th className="py-2 pr-3 text-left text-xs font-semibold text-slate-600">
                महिला हेल्पलाइन
              </th>
              <td className="py-2 font-mono">{contacts.womenHelpline}</td>
            </tr>
            <tr>
              <th className="py-2 pr-3 text-left text-xs font-semibold text-slate-600">
                साइबर अपराध हेल्पलाइन
              </th>
              <td className="py-2 font-mono">{contacts.cyberHelpline}</td>
            </tr>
          </tbody>
        </table>
        <p className="text-[11px] text-slate-500">
          सहायता डेस्क केवल इस मसौदे में मदद करता है। FIR संख्या / जाँच स्थिति हेतु अपने
          क्षेत्राधिकार थाने से संपर्क करें।
        </p>
      </section>

      <footer className="space-y-2 border-t-2 border-[var(--navy)] pt-4 text-[11px] leading-relaxed text-slate-700">
        <p className="font-bold tracking-wide text-[var(--navy)]">महत्वपूर्ण चेतावनी</p>
        <ul className="list-disc space-y-1.5 pl-4">
          <li>
            <strong>आपातकाल:</strong> जीवन, शरीर या संपत्ति को खतरा हो तो तुरंत{" "}
            <strong>{contacts.controlRoom}</strong> डायल करें। मसौदा बनाने का इंतज़ार न करें।
          </li>
          <li>
            यह दस्तावेज़ <strong>केवल मसौदा शिकायत</strong> है। यह <strong>FIR नहीं</strong> है, न
            पुलिस डायरी प्रविष्टि, न जाँच आरंभ।
          </li>
          <li>
            लोक सेवक को झूठी सूचना / झूठी शिकायत भारतीय न्याय संहिता (बीएनएस) के अंतर्गत दंडनीय हो
            सकती है। केवल सत्य तथ्य दें।
          </li>
          <li>
            सुझाई गई अपराध नाम व बीएनएस धाराएँ <strong>अनंतिम व अबाध्य</strong> हैं। संज्ञेयता,
            पंजीकरण व धाराएँ स्टेशन हाउस अधिकारी के अधीन हैं।
          </li>
          <li>
            जब तक थाना विशेष रूप से न माँगे, OTP, पासवर्ड या पूरा आधार नंबर इस मसौदे के साथ न लगाएँ।
          </li>
        </ul>
        <p className="pt-2 text-center font-semibold text-[var(--navy)]">जय हिंद 🇮🇳</p>
      </footer>
    </article>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <tr className="border-b border-[#c5cedd]">
      <th className="w-44 border-r border-[#c5cedd] bg-[#f3f6fb] px-3 py-2 text-left align-top text-xs font-semibold text-slate-700">
        {label}
      </th>
      <td className="px-3 py-2 text-slate-900">{value}</td>
    </tr>
  );
}

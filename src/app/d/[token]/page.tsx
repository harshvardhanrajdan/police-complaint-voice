import Link from "next/link";
import { notFound } from "next/navigation";
import { ComplaintDocument } from "@/components/ComplaintDocument";
import { ReviewActions } from "@/components/ReviewActions";
import { getComplaintByToken } from "@/lib/store";

type Props = { params: Promise<{ token: string }> };

export default async function ReviewPage({ params }: Props) {
  const { token } = await params;
  const complaint = await getComplaintByToken(token);
  if (!complaint) notFound();

  return (
    <main className="print:bg-white">
      <div className="no-print border-b border-[#c5cedd] bg-white">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div>
            <Link
              href="/"
              className="text-sm font-semibold text-[var(--navy)] hover:underline"
            >
              ← पंजीकरण डेस्क पर वापस
            </Link>
            <p className="text-xs text-slate-500">
              इस मसौदे को प्रिंट या साझा करें · 7 दिन तक मान्य
            </p>
          </div>
          <ReviewActions token={token} />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 print:px-0 print:py-0 sm:px-6">
        <div className="portal-card p-6 print:rounded-none print:border-0 print:p-0 print:shadow-none sm:p-10">
          <ComplaintDocument complaint={complaint} />
        </div>
      </div>
    </main>
  );
}

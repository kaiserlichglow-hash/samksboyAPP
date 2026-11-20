import Link from "next/link";
import InvestmentTracker from "../InvestmentTracker";

export default function InvestmentsPage() {
  return (
    <main className="min-h-screen bg-[#090909] px-5 py-8 text-zinc-100 md:px-10">
      <div className="mx-auto max-w-7xl">
        <Link href="/" className="text-sm text-zinc-400 hover:text-white">
          ← Voltar ao painel
        </Link>
        <InvestmentTracker />
      </div>
    </main>
  );
}

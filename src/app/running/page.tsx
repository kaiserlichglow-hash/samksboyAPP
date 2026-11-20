
import Link from "next/link";
import RunningTracker from "../RunningTracker";

export default function RunningPage() {
  return (
    <main className="min-h-screen bg-[#090909] px-5 py-8 text-zinc-100 md:px-10">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="text-sm text-zinc-400 hover:text-white"
        >
          ← Voltar ao painel
        </Link>

        <RunningTracker />
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";

const habits = [
  "Treino concluído",
  "Sono regulado",
  "Investimento mensal",
  "Disciplina diária",
];
export default function Home() {
  const [completed, setCompleted] = useState<string[]>([]);

  function toggleHabit(habit: string) {
    setCompleted((previous) =>
      previous.includes(habit)
        ? previous.filter((item) => item !== habit)
        : [...previous, habit]
    );
  }

  const metrics = [
    {
      label: "TREINO HOJE",
      value: completed.includes("Treino concluído") ? "01" : "00",
      detail: "Sessões marcadas hoje",
    },
    {
      label: "SONO",
      value: "--",
      detail: "Aguardando registro",
    },
    {
      label: "INVESTIMENTOS",
      value: "R$ 0",
      detail: "Aguardando registros",
    },
    {
      label: "DISCIPLINA",
      value: `${completed.length}/4`,
      detail: "Hábitos concluídos",
    },
  ];

  return (
    <main className="min-h-screen bg-[#090909] text-zinc-100">
      <div className="mx-auto max-w-7xl px-5 py-8 md:px-10">
        <header className="flex flex-wrap items-center justify-between gap-6 border-b border-white/10 pb-8">
          <div>
            <p className="text-xs tracking-[0.3em] text-zinc-500">
              PERSONAL PERFORMANCE SYSTEM
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-[0.2em]">
              SAMKS <span className="text-zinc-500">BOY</span>
            </h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">SYSTEM STATUS</p>
            <p className="mt-2 text-sm text-emerald-400">
              ● OPERATIONAL
            </p>
          </div>
        </header>

        <section className="py-12">
          <p className="text-xs tracking-[0.3em] text-zinc-500">
            PERSONAL DASHBOARD
          </p>
          <h2 className="mt-4 text-3xl font-light md:text-5xl">
            Controle sua <strong>evolução.</strong>
          </h2>
          <p className="mt-4 text-sm text-zinc-500">
            Consistência não é uma opção. É um padrão.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="border border-white/10 bg-[#141414] p-6"
            >
              <p className="text-xs tracking-[0.2em] text-zinc-500">
                {metric.label}
              </p>
              <p className="mt-5 text-3xl font-light">
                {metric.value}
              </p>
              <p className="mt-2 text-xs text-zinc-600">
                {metric.detail}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-7 grid gap-5 lg:grid-cols-3">
          <div className="border border-white/10 bg-[#141414] p-6 lg:col-span-2">
            <p className="text-xs tracking-[0.2em] text-zinc-500">
              DAILY PROTOCOL
            </p>
            <h3 className="mt-3 text-xl">Disciplina diária</h3>

            <div className="mt-7 space-y-3">
              {habits.map((habit) => {
                const active = completed.includes(habit);

                return (
                  <button
                    type="button"
                    key={habit}
                    onClick={() => toggleHabit(habit)}
                    className={`flex w-full items-center justify-between gap-3 border p-4 text-left text-sm transition ${
                      active
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : "border-white/10 bg-[#0b0b0b] hover:border-white/30"
                    }`}
                  >
                    <span>{habit}</span>
                    <span
                      className={
                        active ? "text-emerald-400" : "text-zinc-500"
                      }
                    >
                      {active ? "✓ CONCLUÍDO" : "○ PENDENTE"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border border-white/10 bg-[#141414] p-6">
            <p className="text-xs tracking-[0.2em] text-zinc-500">
              SYSTEM PRINCIPLE
            </p>
            <p className="mt-10 text-5xl font-light">01</p>
            <h3 className="mt-6 text-xl">Consistency.</h3>
            <p className="mt-4 text-sm leading-7 text-zinc-500">
              Pequenas ações executadas diariamente
              constroem resultados extraordinários.
            </p>
            <div className="mt-10 border-t border-white/10 pt-5">
              <p className="text-xs text-zinc-600">
                SAMKS BOY APP / PRIVATE SYSTEM
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-12 border-t border-white/10 py-6 text-center text-xs tracking-widest text-zinc-600">
          SAMKS BOY APP — DISCIPLINE IS THE STANDARD
        </footer>
      </div>
    </main>
  );
}



"use client";

import { useEffect, useState } from "react";

const YEAR = 2026;
const MONTHLY_GOAL = 100;
const ANNUAL_GOAL = MONTHLY_GOAL * 12;
const STORAGE_KEY = `samksboyapp-investments-${YEAR}`;

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

type InvestmentRecords = Record<string, number>;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function InvestmentTracker() {
  const [investments, setInvestments] =
    useState<InvestmentRecords>({});

  const [selectedMonth, setSelectedMonth] =
    useState<number | null>(null);

  const [amount, setAmount] = useState("100");
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed: unknown = JSON.parse(saved);

        if (
          parsed !== null &&
          typeof parsed === "object" &&
          !Array.isArray(parsed)
        ) {
          const validRecords: InvestmentRecords = {};

          for (const [month, value] of Object.entries(parsed)) {
            const monthNumber = Number(month);

            if (
              Number.isInteger(monthNumber) &&
              monthNumber >= 0 &&
              monthNumber <= 11 &&
              String(monthNumber) === month &&
              typeof value === "number" &&
              Number.isFinite(value) &&
              value > 0
            ) {
              validRecords[month] = value;
            }
          }

          setInvestments(validRecords);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar investimentos:", error);
    }

    setLoaded(true);
  }, []);

  const totalInvested = Object.values(investments).reduce(
    (total, value) => total + value,
    0
  );

  const monthsCompleted = Object.values(investments).filter(
    (value) => value >= MONTHLY_GOAL
  ).length;

  const progress = Math.min(
    (totalInvested / ANNUAL_GOAL) * 100,
    100
  );

  function openMonth(monthIndex: number) {
    setSelectedMonth(monthIndex);

    const savedValue = investments[String(monthIndex)];

    setAmount(
      savedValue !== undefined
        ? String(savedValue)
        : String(MONTHLY_GOAL)
    );

    setMessage("");
  }

  function saveInvestment() {
    if (selectedMonth === null) return;

    const normalized = amount.trim().replace(",", ".");
    const value = Number(normalized);

    if (
      normalized === "" ||
      !Number.isFinite(value) ||
      value <= 0 ||
      value > 1000000000 ||
      !/^\d+(\.\d{1,2})?$/.test(normalized)
    ) {
      setMessage(
        "Informe um valor positivo, com até duas casas decimais."
      );
      return;
    }

    const updated = {
      ...investments,
      [String(selectedMonth)]: value,
    };

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated)
      );

      setInvestments(updated);
      setSelectedMonth(null);
      setMessage("");
    } catch (error) {
      console.error("Erro ao salvar investimento:", error);
      setMessage("Não foi possível salvar o registro.");
    }
  }

  function removeInvestment() {
    if (selectedMonth === null) return;

    const updated = { ...investments };

    delete updated[String(selectedMonth)];

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated)
      );

      setInvestments(updated);
      setSelectedMonth(null);
      setMessage("");
    } catch (error) {
      console.error("Erro ao remover investimento:", error);
      setMessage("Não foi possível remover o registro.");
    }
  }

  return (
    <section className="mt-12">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs tracking-[0.25em] text-zinc-500">
            INVESTMENT CONTROL
          </p>

          <h3 className="mt-3 text-2xl font-light">
            Controle de investimentos
          </h3>

          <p className="mt-2 text-sm text-zinc-500">
            Acompanhe seus aportes mensais e sua meta anual.
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs tracking-widest text-zinc-500">
            TOTAL INVESTIDO / {YEAR}
          </p>

          <p className="mt-2 text-3xl font-light text-emerald-400">
            {loaded ? formatCurrency(totalInvested) : "—"}
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="border border-white/10 bg-[#141414] p-5">
          <p className="text-xs text-zinc-500">
            META MENSAL
          </p>
          <p className="mt-3 text-2xl font-light">
            {formatCurrency(MONTHLY_GOAL)}
          </p>
        </div>

        <div className="border border-white/10 bg-[#141414] p-5">
          <p className="text-xs text-zinc-500">
            META ANUAL
          </p>
          <p className="mt-3 text-2xl font-light">
            {formatCurrency(ANNUAL_GOAL)}
          </p>
        </div>

        <div className="border border-white/10 bg-[#141414] p-5">
          <p className="text-xs text-zinc-500">
            MESES COM META ATINGIDA
          </p>
          <p className="mt-3 text-2xl font-light">
            {loaded ? `${monthsCompleted}/12` : "—"}
          </p>
        </div>
      </div>

      <div className="border border-white/10 bg-[#141414] p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-zinc-400">
            Progresso da meta anual
          </p>

          <p className="text-sm text-zinc-300">
            {loaded ? `${progress.toFixed(1)}%` : "—"}
          </p>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#292929]">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all"
            style={{ width: `${loaded ? progress : 0}%` }}
          />
        </div>

        <p className="mt-3 text-xs text-zinc-500">
          O progresso é limitado visualmente a 100%.
          Aportes acima da meta continuam somando ao total.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {MONTHS.map((month, index) => {
          const recorded = investments[String(index)];
          const hasRecord = recorded !== undefined;
          const goalReached =
            hasRecord && recorded >= MONTHLY_GOAL;

          return (
            <button
              key={month}
              type="button"
              onClick={() => openMonth(index)}
              className={`border p-5 text-left transition hover:border-white/40 ${
                goalReached
                  ? "border-emerald-600/40 bg-emerald-600/5"
                  : "border-white/10 bg-[#141414]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{month}</p>
                <span
                  className={
                    goalReached
                      ? "text-emerald-400"
                      : "text-zinc-500"
                  }
                >
                  {goalReached ? "✓" : hasRecord ? "◐" : "○"}
                </span>
              </div>

              <p className="mt-6 text-xl font-light">
                {hasRecord
                  ? formatCurrency(recorded)
                  : "Sem aporte"}
              </p>

              <p className="mt-2 text-xs text-zinc-500">
                {goalReached
                  ? "Meta mensal atingida"
                  : hasRecord
                    ? "Abaixo da meta mensal"
                    : "Aguardando registro"}
              </p>
            </button>
          );
        })}
      </div>

      {selectedMonth !== null && (
        <div className="mt-6 border border-white/20 bg-[#191919] p-6">
          <p className="text-xs tracking-widest text-zinc-500">
            REGISTRAR INVESTIMENTO
          </p>

          <h4 className="mt-3 text-xl">
            {MONTHS[selectedMonth]} de {YEAR}
          </h4>

          <label
            htmlFor="investment-amount"
            className="mt-5 block text-sm text-zinc-400"
          >
            Valor investido (R$)
          </label>

          <input
            id="investment-amount"
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="100,00"
            className="mt-3 w-full max-w-xs border border-white/20 bg-black p-3 text-white outline-none focus:border-white/60"
          />

          {message && (
            <p className="mt-3 text-sm text-red-400" role="alert">
              {message}
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={saveInvestment}
              className="bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-300"
            >
              Salvar aporte
            </button>

            {investments[String(selectedMonth)] !== undefined && (
              <button
                type="button"
                onClick={removeInvestment}
                className="border border-red-500/30 px-5 py-3 text-sm text-red-400 hover:bg-red-500/10"
              >
                Remover registro
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setSelectedMonth(null);
                setMessage("");
              }}
              className="border border-white/10 px-5 py-3 text-sm text-zinc-400 hover:bg-white/5"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <p className="mt-5 text-xs text-zinc-600">
        Os valores são registros manuais de aportes, não
        representam o saldo atual nem a rentabilidade dos
        investimentos. Os dados são salvos neste navegador.
      </p>
    </section>
  );
}
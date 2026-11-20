
"use client";

import { useEffect, useState } from "react";

const YEAR = 2026;

const DEFAULT_MONTHLY_GOAL = 100;
const DEFAULT_ANNUAL_GOAL = 1200;

const STORAGE_KEY = `samksboyapp-investments-${YEAR}`;
const GOALS_STORAGE_KEY = "samksboyapp-investment-goals";

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

type InvestmentGoals = {
  monthlyGoal: number;
  annualGoal: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function parseAmount(input: string): number | null {
  const text = input.trim();

  if (!text) return null;

  let normalized = text;

  if (text.includes(",")) {
    normalized = text.replace(/\./g, "").replace(",", ".");
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const value = Number(normalized);

  if (
    !Number.isFinite(value) ||
    value <= 0 ||
    value > 1000000000
  ) {
    return null;
  }

  return value;
}

export default function InvestmentTracker() {
  const [investments, setInvestments] =
    useState<InvestmentRecords>({});

  const [selectedMonth, setSelectedMonth] =
    useState<number | null>(null);

  const [amount, setAmount] = useState("100");

  const [monthlyGoal, setMonthlyGoal] = useState(
    DEFAULT_MONTHLY_GOAL
  );

  const [annualGoal, setAnnualGoal] = useState(
    DEFAULT_ANNUAL_GOAL
  );

  const [monthlyGoalInput, setMonthlyGoalInput] =
    useState("100");

  const [annualGoalInput, setAnnualGoalInput] =
    useState("1200");

  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [goalMessage, setGoalMessage] = useState("");

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

    try {
      const savedGoals = localStorage.getItem(
        GOALS_STORAGE_KEY
      );

      if (savedGoals) {
        const parsed: unknown = JSON.parse(savedGoals);

        if (
          parsed !== null &&
          typeof parsed === "object" &&
          !Array.isArray(parsed)
        ) {
          const goals = parsed as Partial<InvestmentGoals>;

          if (
            typeof goals.monthlyGoal === "number" &&
            Number.isFinite(goals.monthlyGoal) &&
            goals.monthlyGoal > 0
          ) {
            setMonthlyGoal(goals.monthlyGoal);
            setMonthlyGoalInput(String(goals.monthlyGoal));
          }

          if (
            typeof goals.annualGoal === "number" &&
            Number.isFinite(goals.annualGoal) &&
            goals.annualGoal > 0
          ) {
            setAnnualGoal(goals.annualGoal);
            setAnnualGoalInput(String(goals.annualGoal));
          }
        }
      }
    } catch (error) {
      console.error("Erro ao carregar metas:", error);
    }

    setLoaded(true);
  }, []);

  const totalInvested = Object.values(investments).reduce(
    (total, value) => total + value,
    0
  );

  const monthsCompleted = Object.values(investments).filter(
    (value) => value >= monthlyGoal
  ).length;

  const progress = Math.min(
    (totalInvested / annualGoal) * 100,
    100
  );

  const remaining = Math.max(
    annualGoal - totalInvested,
    0
  );

  function saveGoals() {
    const newMonthlyGoal = parseAmount(monthlyGoalInput);
    const newAnnualGoal = parseAmount(annualGoalInput);

    if (
      newMonthlyGoal === null ||
      newAnnualGoal === null
    ) {
      setGoalMessage(
        "Informe valores positivos válidos, com até duas casas decimais."
      );
      return;
    }

    const updatedGoals: InvestmentGoals = {
      monthlyGoal: newMonthlyGoal,
      annualGoal: newAnnualGoal,
    };

    try {
      localStorage.setItem(
        GOALS_STORAGE_KEY,
        JSON.stringify(updatedGoals)
      );

      setMonthlyGoal(newMonthlyGoal);
      setAnnualGoal(newAnnualGoal);
      setGoalMessage("Metas atualizadas com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar metas:", error);
      setGoalMessage("Não foi possível salvar as metas.");
    }
  }

  function openMonth(monthIndex: number) {
    setSelectedMonth(monthIndex);

    const savedValue = investments[String(monthIndex)];

    setAmount(
      savedValue !== undefined
        ? String(savedValue)
        : String(monthlyGoal)
    );

    setMessage("");
  }

  function saveInvestment() {
    if (selectedMonth === null) return;

    const value = parseAmount(amount);

    if (value === null) {
      setMessage(
        "Informe um valor positivo válido, com até duas casas decimais."
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
      setMessage("Não foi possível salvar o aporte.");
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
      setMessage("Não foi possível remover o aporte.");
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
            Acompanhe seus aportes e personalize suas metas.
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
            {formatCurrency(monthlyGoal)}
          </p>
        </div>

        <div className="border border-white/10 bg-[#141414] p-5">
          <p className="text-xs text-zinc-500">
            META ANUAL
          </p>
          <p className="mt-3 text-2xl font-light">
            {formatCurrency(annualGoal)}
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

      <div className="mb-6 border border-white/10 bg-[#141414] p-6">
        <p className="text-xs tracking-[0.2em] text-zinc-500">
          CUSTOM FINANCIAL GOALS
        </p>

        <h4 className="mt-3 text-xl font-light">
          Personalizar metas
        </h4>

        <p className="mt-2 text-sm text-zinc-500">
          Escolha livremente suas metas mensal e anual.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="monthly-goal"
              className="block text-xs text-zinc-400"
            >
              Meta mensal (R$)
            </label>

            <input
              id="monthly-goal"
              type="text"
              inputMode="decimal"
              value={monthlyGoalInput}
              onChange={(event) => {
                setMonthlyGoalInput(event.target.value);
                setGoalMessage("");
              }}
              className="mt-3 w-full border border-white/20 bg-black p-3 text-white outline-none focus:border-white/60"
            />
          </div>

          <div>
            <label
              htmlFor="annual-goal"
              className="block text-xs text-zinc-400"
            >
              Meta anual (R$)
            </label>

            <input
              id="annual-goal"
              type="text"
              inputMode="decimal"
              value={annualGoalInput}
              onChange={(event) => {
                setAnnualGoalInput(event.target.value);
                setGoalMessage("");
              }}
              className="mt-3 w-full border border-white/20 bg-black p-3 text-white outline-none focus:border-white/60"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={saveGoals}
          disabled={!loaded}
          className="mt-5 bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-zinc-300 disabled:opacity-50"
        >
          Salvar metas
        </button>

        {goalMessage && (
          <p className="mt-4 text-sm text-zinc-300" role="status">
            {goalMessage}
          </p>
        )}

        <p className="mt-4 text-xs text-zinc-600">
          Alterar suas metas não modifica os aportes registrados.
          Os dois valores são configurados independentemente.
        </p>
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
            style={{
              width: `${loaded ? progress : 0}%`,
            }}
          />
        </div>

        <p className="mt-4 text-xs text-zinc-500">
          Falta para a meta: {formatCurrency(remaining)}
        </p>

        <p className="mt-2 text-xs text-zinc-600">
          O progresso visual é limitado a 100%.
          Aportes acima da meta continuam no total.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {MONTHS.map((month, index) => {
          const recorded = investments[String(index)];

          const hasRecord = recorded !== undefined;

          const goalReached =
            hasRecord && recorded >= monthlyGoal;

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
                <p className="text-sm font-medium">
                  {month}
                </p>

                <span
                  className={
                    goalReached
                      ? "text-emerald-400"
                      : "text-zinc-500"
                  }
                >
                  {goalReached
                    ? "✓"
                    : hasRecord
                      ? "◐"
                      : "○"}
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
            onChange={(event) =>
              setAmount(event.target.value)
            }
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
              className="bg-white px-5 py-3 text-sm font-medium text-black hover:bg-zinc-300"
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

      <p className="mt-5 text-xs leading-6 text-zinc-600">
        Os registros representam aportes manuais, não o saldo
        atual ou a rentabilidade dos investimentos.
        Os dados permanecem armazenados neste navegador.
      </p>
    </section>
  );
}

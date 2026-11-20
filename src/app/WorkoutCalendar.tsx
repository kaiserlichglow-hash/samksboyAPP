
"use client";

import { useEffect, useState } from "react";

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril",
  "Maio", "Junho", "Julho", "Agosto",
  "Setembro", "Outubro", "Novembro", "Dezembro",
];

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

const YEAR = 2026;
const STORAGE_KEY = `samksboyapp-workouts-${YEAR}`;

export default function WorkoutCalendar() {
  const [workouts, setWorkouts] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed: unknown = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setWorkouts(
            parsed.filter(
              (value): value is string =>
                typeof value === "string"
            )
          );
        }
      }
    } catch (error) {
      console.error("Erro ao carregar treinos:", error);
    }

    setLoaded(true);
  }, []);

  function toggleWorkout(date: string) {
    const updated = workouts.includes(date)
      ? workouts.filter((item) => item !== date)
      : [...workouts, date];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setWorkouts(updated);
    } catch (error) {
      console.error("Erro ao salvar treino:", error);
    }
  }

  function renderMonth(monthIndex: number) {
    const daysInMonth = new Date(
      YEAR,
      monthIndex + 1,
      0
    ).getDate();

    const firstWeekday = new Date(
      YEAR,
      monthIndex,
      1
    ).getDay();

    const monthDates = Array.from(
      { length: daysInMonth },
      (_, index) => index + 1
    );

    return (
      <div
        key={monthIndex}
        className="rounded-3xl border border-white/10 bg-[#141414]/90 p-5 shadow-lg shadow-black/20 backdrop-blur-xl"
      >
        <div className="mb-5 flex items-center justify-between">
          <h4 className="text-sm font-medium">
            {MONTHS[monthIndex]}
          </h4>

          <span className="text-xs text-zinc-500">
            {workouts.filter((date) =>
              date.startsWith(
                `${YEAR}-${String(monthIndex + 1).padStart(2, "0")}-`
              )
            ).length}{" "}
            treinos
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((day, index) => (
            <div
              key={index}
              className="pb-2 text-center text-[10px] text-zinc-600"
            >
              {day}
            </div>
          ))}

          {Array.from(
            { length: firstWeekday },
            (_, index) => (
              <div key={`empty-${index}`} />
            )
          )}

          {monthDates.map((day) => {
            const date = `${YEAR}-${String(
              monthIndex + 1
            ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

            const active = workouts.includes(date);

            return (
              <button
                key={date}
                type="button"
                onClick={() => toggleWorkout(date)}
                aria-label={`${day} de ${MONTHS[monthIndex]} de ${YEAR}`}
                aria-pressed={active}
                className={`aspect-square min-w-0 rounded-lg text-xs transition ${
                  active
                    ? "bg-emerald-600 text-white"
                    : "bg-[#202020] text-zinc-400 hover:bg-[#363636]"
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <section className="mt-10">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.25em] text-zinc-500">
            WORKOUT TRACKER
          </p>

          <h3 className="mt-3 text-2xl font-light">
            Calendário de academia
          </h3>

          <p className="mt-2 text-sm text-zinc-500">
            Registre seus treinos e acompanhe sua consistência.
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs tracking-widest text-zinc-500">
            TOTAL DE TREINOS / {YEAR}
          </p>

          <p className="mt-2 text-4xl font-light">
            {loaded ? workouts.length : "—"}
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {MONTHS.map((_, index) => renderMonth(index))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-5 text-xs text-zinc-500">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 bg-emerald-600" />
          Treino realizado
        </span>

        <span className="flex items-center gap-2">
          <span className="h-3 w-3 bg-[#202020]" />
          Sem registro
        </span>
      </div>

      <p className="mt-4 text-xs text-zinc-600">
        Os registros são salvos neste navegador.
        A sincronização entre dispositivos será implementada
        em uma etapa futura.
      </p>
    </section>
  );
}


"use client";

import { useEffect, useState } from "react";

const YEAR = 2026;
const STORAGE_KEY = `samksboyapp-sleep-${YEAR}`;

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

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

type SleepRecords = Record<string, number>;

function getSleepColor(hours: number | undefined) {
  if (hours === undefined) {
    return "bg-[#252525] text-zinc-500 hover:bg-[#393939]";
  }

  if (hours < 6) {
    return "bg-red-700 text-white";
  }

  if (hours < 8) {
    return "bg-orange-500 text-black";
  }

  return "bg-emerald-600 text-white";
}

export default function SleepCalendar() {
  const [records, setRecords] = useState<SleepRecords>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hours, setHours] = useState("");
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
          const validRecords: SleepRecords = {};

          for (const [date, value] of Object.entries(parsed)) {
            if (
              /^\d{4}-\d{2}-\d{2}$/.test(date) &&
              date.startsWith(`${YEAR}-`) &&
              typeof value === "number" &&
              Number.isFinite(value) &&
              value >= 0 &&
              value <= 24
            ) {
              validRecords[date] = value;
            }
          }

          setRecords(validRecords);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar sono:", error);
    }

    setLoaded(true);
  }, []);

  const values = Object.values(records);
  const totalHours = values.reduce((sum, value) => sum + value, 0);
  const average = values.length > 0 ? totalHours / values.length : 0;

  const daysWithGoal = values.filter((value) => value >= 8).length;

  function selectDay(date: string) {
    setSelectedDate(date);
    setHours(
      records[date] !== undefined ? String(records[date]) : ""
    );
    setMessage("");
  }

  function saveSleep() {
    if (!selectedDate) return;

    const value = Number(hours.replace(",", "."));

    if (
      hours.trim() === "" ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > 24
    ) {
      setMessage("Informe um valor entre 0 e 24 horas.");
      return;
    }

    const updated = {
      ...records,
      [selectedDate]: value,
    };

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated)
      );

      setRecords(updated);
      setSelectedDate(null);
      setHours("");
      setMessage("");
    } catch (error) {
      console.error("Erro ao salvar sono:", error);
      setMessage("Não foi possível salvar o registro.");
    }
  }

  function removeSleep() {
    if (!selectedDate) return;

    const updated = { ...records };
    delete updated[selectedDate];

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updated)
      );

      setRecords(updated);
      setSelectedDate(null);
      setHours("");
      setMessage("");
    } catch (error) {
      console.error("Erro ao remover sono:", error);
      setMessage("Não foi possível remover o registro.");
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

    const monthNumber = String(monthIndex + 1).padStart(2, "0");

    return (
      <div
        key={monthIndex}
        className="border border-white/10 bg-[#141414] p-5"
      >
        <div className="mb-5 flex items-center justify-between">
          <h4 className="text-sm font-medium">
            {MONTHS[monthIndex]}
          </h4>

          <span className="text-xs text-zinc-500">
            {
              Object.keys(records).filter((date) =>
                date.startsWith(`${YEAR}-${monthNumber}-`)
              ).length
            }{" "}
            registros
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2">
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

          {Array.from(
            { length: daysInMonth },
            (_, index) => {
              const day = index + 1;

              const date = `${YEAR}-${monthNumber}-${String(
                day
              ).padStart(2, "0")}`;

              const dayHours = records[date];

              return (
                <button
                  key={date}
                  type="button"
                  onClick={() => selectDay(date)}
                  aria-label={`${day} de ${MONTHS[monthIndex]}: ${
                    dayHours === undefined
                      ? "sem registro"
                      : `${dayHours} horas de sono`
                  }`}
                  className={`aspect-square min-w-0 rounded-full text-[11px] transition ${getSleepColor(
                    dayHours
                  )} ${
                    selectedDate === date
                      ? "ring-2 ring-white ring-offset-2 ring-offset-[#141414]"
                      : ""
                  }`}
                >
                  {day}
                </button>
              );
            }
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="mt-12">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs tracking-[0.25em] text-zinc-500">
            SLEEP ANALYTICS
          </p>

          <h3 className="mt-3 text-2xl font-light">
            Calendário de sono
          </h3>

          <p className="mt-2 text-sm text-zinc-500">
            Registre suas horas de sono e acompanhe sua evolução.
          </p>
        </div>

        <div className="flex flex-wrap gap-8">
          <div>
            <p className="text-xs tracking-widest text-zinc-500">
              MÉDIA DE SONO
            </p>

            <p className="mt-2 text-3xl font-light">
              {loaded && values.length > 0
                ? `${average.toFixed(1)}h`
                : "—"}
            </p>
          </div>

          <div>
            <p className="text-xs tracking-widest text-zinc-500">
              DIAS COM 8H+
            </p>

            <p className="mt-2 text-3xl font-light">
              {loaded ? daysWithGoal : "—"}
            </p>
          </div>
        </div>
      </div>

      {selectedDate && (
        <div className="mb-6 border border-white/20 bg-[#191919] p-6">
          <p className="text-xs tracking-[0.2em] text-zinc-500">
            REGISTRO DE SONO
          </p>

          <h4 className="mt-3 text-lg">
            {selectedDate.split("-").reverse().join("/")}
          </h4>

          <label
            htmlFor="sleep-hours"
            className="mt-5 block text-sm text-zinc-400"
          >
            Quantas horas você dormiu?
          </label>

          <input
            id="sleep-hours"
            type="text"
            inputMode="decimal"
            value={hours}
            onChange={(event) => setHours(event.target.value)}
            placeholder="Exemplo: 7.5"
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
              onClick={saveSleep}
              className="bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-300"
            >
              Salvar sono
            </button>

            {records[selectedDate] !== undefined && (
              <button
                type="button"
                onClick={removeSleep}
                className="border border-red-500/30 px-5 py-3 text-sm text-red-400 transition hover:bg-red-500/10"
              >
                Remover registro
              </button>
            )}

            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="border border-white/10 px-5 py-3 text-sm text-zinc-400 transition hover:bg-white/5"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {MONTHS.map((_, index) => renderMonth(index))}
      </div>

      <div className="mt-6 flex flex-wrap gap-5 text-xs text-zinc-400">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-700" />
          Menos de 6h
        </span>

        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-orange-500" />
          6h até menos de 8h
        </span>

        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-600" />
          8h ou mais
        </span>

        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#252525]" />
          Sem registro
        </span>
      </div>

      <p className="mt-5 text-xs text-zinc-600">
        Os registros são armazenados neste navegador.
        A sincronização entre dispositivos será adicionada futuramente.
      </p>
    </section>
  );
}

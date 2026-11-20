
"use client";

import { useEffect, useState } from "react";

type ReminderSettingsData = {
  gymEnabled: boolean;
  gymTime: string;
  sleepEnabled: boolean;
  sleepTime: string;
  investmentEnabled: boolean;
  investmentDay: number;
  investmentTime: string;
};

const STORAGE_KEY = "samksboyapp-reminder-settings";

const DEFAULT_SETTINGS: ReminderSettingsData = {
  gymEnabled: true,
  gymTime: "07:00",
  sleepEnabled: true,
  sleepTime: "22:00",
  investmentEnabled: true,
  investmentDay: 5,
  investmentTime: "09:00",
};

export default function ReminderSettings() {
  const [settings, setSettings] =
    useState<ReminderSettingsData>(DEFAULT_SETTINGS);

  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed: unknown = JSON.parse(saved);

        if (
          parsed &&
          typeof parsed === "object" &&
          !Array.isArray(parsed)
        ) {
          const data = parsed as Record<string, unknown>;
          const validTime = (value: unknown) =>
            typeof value === "string" &&
            /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

          setSettings({
            gymEnabled:
              typeof data.gymEnabled === "boolean"
                ? data.gymEnabled
                : DEFAULT_SETTINGS.gymEnabled,
            gymTime: validTime(data.gymTime)
              ? String(data.gymTime)
              : DEFAULT_SETTINGS.gymTime,
            sleepEnabled:
              typeof data.sleepEnabled === "boolean"
                ? data.sleepEnabled
                : DEFAULT_SETTINGS.sleepEnabled,
            sleepTime: validTime(data.sleepTime)
              ? String(data.sleepTime)
              : DEFAULT_SETTINGS.sleepTime,
            investmentEnabled:
              typeof data.investmentEnabled === "boolean"
                ? data.investmentEnabled
                : DEFAULT_SETTINGS.investmentEnabled,
            investmentDay:
              typeof data.investmentDay === "number" &&
              Number.isInteger(data.investmentDay) &&
              data.investmentDay >= 1 &&
              data.investmentDay <= 28
                ? data.investmentDay
                : DEFAULT_SETTINGS.investmentDay,
            investmentTime: validTime(data.investmentTime)
              ? String(data.investmentTime)
              : DEFAULT_SETTINGS.investmentTime,
          });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar lembretes:", error);
      setMessage("Não foi possível carregar as configurações.");
    }

    setLoaded(true);
  }, []);

  function updateSettings(
    changes: Partial<ReminderSettingsData>
  ) {
    setSettings((current) => ({
      ...current,
      ...changes,
    }));

    setMessage("");
  }

  function saveSettings() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(settings)
      );

      setMessage("Configurações salvas neste navegador.");
    } catch (error) {
      console.error("Erro ao salvar lembretes:", error);
      setMessage("Não foi possível salvar as configurações.");
    }
  }

  return (
    <section className="mt-12">
      <div className="mb-7">
        <p className="text-xs tracking-[0.25em] text-zinc-500">
          PERSONAL REMINDER SYSTEM
        </p>

        <h3 className="mt-3 text-2xl font-light">
          Lembretes & Rotina
        </h3>

        <p className="mt-2 text-sm text-zinc-500">
          Configure seus horários de disciplina pessoal.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="border border-white/10 bg-[#141414] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs tracking-widest text-zinc-500">
                WORKOUT REMINDER
              </p>
              <h4 className="mt-3 text-xl">Academia</h4>
            </div>

            <input
              type="checkbox"
              aria-label="Ativar lembrete de academia"
              checked={settings.gymEnabled}
              onChange={(event) =>
                updateSettings({
                  gymEnabled: event.target.checked,
                })
              }
              className="h-5 w-5 accent-emerald-600"
            />
          </div>

          <p className="mt-5 text-sm text-zinc-500">
            Lembrete diário para realizar seu treino.
          </p>

          <label
            htmlFor="gym-time"
            className="mt-7 block text-xs tracking-widest text-zinc-500"
          >
            HORÁRIO DO TREINO
          </label>

          <input
            id="gym-time"
            type="time"
            value={settings.gymTime}
            disabled={!settings.gymEnabled}
            onChange={(event) =>
              updateSettings({
                gymTime: event.target.value,
              })
            }
            className="mt-3 w-full border border-white/20 bg-[#202020] p-3 text-white scheme-dark disabled:opacity-40"
          />

          <p className="mt-5 text-xs text-zinc-600">
            Frequência: todos os dias
          </p>
        </div>

        <div className="border border-white/10 bg-[#141414] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs tracking-widest text-zinc-500">
                SLEEP REMINDER
              </p>
              <h4 className="mt-3 text-xl">Sono</h4>
            </div>

            <input
              type="checkbox"
              aria-label="Ativar lembrete de sono"
              checked={settings.sleepEnabled}
              onChange={(event) =>
                updateSettings({
                  sleepEnabled: event.target.checked,
                })
              }
              className="h-5 w-5 accent-emerald-600"
            />
          </div>

          <p className="mt-5 text-sm text-zinc-500">
            Prepare-se para dormir no horário escolhido.
          </p>

          <label
            htmlFor="sleep-time"
            className="mt-7 block text-xs tracking-widest text-zinc-500"
          >
            HORÁRIO DE DORMIR
          </label>

          <input
            id="sleep-time"
            type="time"
            value={settings.sleepTime}
            disabled={!settings.sleepEnabled}
            onChange={(event) =>
              updateSettings({
                sleepTime: event.target.value,
              })
            }
            className="mt-3 w-full border border-white/20 bg-[#202020] p-3 text-white scheme-dark disabled:opacity-40"
          />

          <p className="mt-5 text-xs text-zinc-600">
            Frequência: todos os dias
          </p>
        </div>

        <div className="border border-white/10 bg-[#141414] p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs tracking-widest text-zinc-500">
                INVESTMENT REMINDER
              </p>
              <h4 className="mt-3 text-xl">Investimentos</h4>
            </div>

            <input
              type="checkbox"
              aria-label="Ativar lembrete de investimento"
              checked={settings.investmentEnabled}
              onChange={(event) =>
                updateSettings({
                  investmentEnabled: event.target.checked,
                })
              }
              className="h-5 w-5 accent-emerald-600"
            />
          </div>

          <p className="mt-5 text-sm text-zinc-500">
            Lembrete mensal para investir R$ 100.
          </p>

          <label
            htmlFor="investment-day"
            className="mt-5 block text-xs tracking-widest text-zinc-500"
          >
            DIA DO MÊS
          </label>

          <select
            id="investment-day"
            value={settings.investmentDay}
            disabled={!settings.investmentEnabled}
            onChange={(event) =>
              updateSettings({
                investmentDay: Number(event.target.value),
              })
            }
            className="mt-3 w-full border border-white/20 bg-[#202020] p-3 text-white disabled:opacity-40"
          >
            {Array.from({ length: 28 }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                Dia {index + 1}
              </option>
            ))}
          </select>

          <label
            htmlFor="investment-time"
            className="mt-5 block text-xs tracking-widest text-zinc-500"
          >
            HORÁRIO
          </label>

          <input
            id="investment-time"
            type="time"
            value={settings.investmentTime}
            disabled={!settings.investmentEnabled}
            onChange={(event) =>
              updateSettings({
                investmentTime: event.target.value,
              })
            }
            className="mt-3 w-full border border-white/20 bg-[#202020] p-3 text-white scheme-dark disabled:opacity-40"
          />
        </div>
      </div>

      <div className="mt-6 border border-white/10 bg-[#141414] p-6">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="text-xs tracking-widest text-zinc-500">
              REMINDER SETTINGS
            </p>

            <p className="mt-2 text-sm text-zinc-400">
              Salve seus horários e preferências.
            </p>
          </div>

          <button
            type="button"
            onClick={saveSettings}
            disabled={!loaded}
            className="bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-zinc-300 disabled:opacity-40"
          >
            Salvar configurações
          </button>
        </div>

        {message && (
          <p
            role="status"
            className="mt-4 text-sm text-emerald-400"
          >
            {message}
          </p>
        )}

        <p className="mt-5 text-xs leading-6 text-zinc-500">
          Nesta etapa, os horários são salvos no navegador.
          As notificações automáticas ainda não estão ativadas.
          A entrega dos alertas será implementada com
          notificações push em uma próxima etapa.
        </p>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { exportRunShareImage } from "./RunShareImage";
type Run = {
  id: string;
  date: string;
  distance: number;
  duration: number;
  source?: "manual" | "gps";
};

type TrackPoint = {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: number;
};

const STORAGE_KEY = "samksboyapp-runs-v1";

function getTodayLocalISO() {
  const now = new Date();

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));

  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${minutes}:${String(secs).padStart(2, "0")}`;
}

function formatPace(seconds: number, distance: number) {
  if (distance <= 0) return "--:--";

  const total = Math.round(seconds / distance);
  const minutes = Math.floor(total / 60);
  const secs = total % 60;

  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function haversineDistanceKm(a: TrackPoint, b: TrackPoint) {
  const toRad = (value: number) => (value * Math.PI) / 180;

  const earthRadiusKm = 6371;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const value =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));

  return earthRadiusKm * c;
}

export default function RunningTracker() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loaded, setLoaded] = useState(false);

  const [date, setDate] = useState("");
  const [distance, setDistance] = useState("");
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("0");
  const [error, setError] = useState("");
const [imageMenuId, setImageMenuId] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingSeconds, setTrackingSeconds] = useState(0);
  const [liveDistance, setLiveDistance] = useState(0);
  const [trackingMessage, setTrackingMessage] = useState(
    "Pronto para iniciar."
  );

  const watchIdRef = useRef<number | null>(null);
  const timerIdRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const lastPointRef = useRef<TrackPoint | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setRuns(parsed);
        }
      }
    } catch {
      setRuns([]);
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(runs));
  }, [runs, loaded]);

  useEffect(() => {
    setDate(getTodayLocalISO());
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      if (timerIdRef.current !== null) {
        window.clearInterval(timerIdRef.current);
      }
    };
  }, []);

  function addRun() {
    const km = Number(distance.replace(",", "."));
    const min = Number(minutes);
    const sec = Number(seconds);
    const duration = min * 60 + sec;

    if (
      !date ||
      !Number.isFinite(km) ||
      km <= 0 ||
      !Number.isInteger(min) ||
      min < 0 ||
      !Number.isInteger(sec) ||
      sec < 0 ||
      sec > 59 ||
      duration <= 0
    ) {
      setError("Informe uma data, distância e tempo válidos.");
      return;
    }

    const run: Run = {
      id: crypto.randomUUID(),
      date,
      distance: km,
      duration,
      source: "manual",
    };

    setRuns((previous) =>
      [run, ...previous].sort((a, b) => b.date.localeCompare(a.date))
    );

    setDistance("");
    setMinutes("");
    setSeconds("0");
    setDate(getTodayLocalISO());
    setError("");
  }

  function resetTrackingState() {
    setTrackingSeconds(0);
    setLiveDistance(0);
    setTrackingMessage("Pronto para iniciar.");
    lastPointRef.current = null;
    startedAtRef.current = null;
  }

  function startTracking() {
    setError("");

    if (!("geolocation" in navigator)) {
      setTrackingMessage("Geolocalização não suportada neste dispositivo.");
      return;
    }

    if (isTracking) return;

    setIsTracking(true);
    setTrackingSeconds(0);
    setLiveDistance(0);
    setTrackingMessage("Buscando sinal de GPS...");
    lastPointRef.current = null;

    const startedAt = Date.now();
    startedAtRef.current = startedAt;

    timerIdRef.current = window.setInterval(() => {
      if (startedAtRef.current === null) return;

      const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
      setTrackingSeconds(elapsed);
    }, 1000);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const nextPoint: TrackPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };

        if (nextPoint.accuracy > 80) {
          setTrackingMessage(
            "Sinal fraco de GPS. Aguardando leitura mais precisa..."
          );
          return;
        }

        if (!lastPointRef.current) {
          lastPointRef.current = nextPoint;
          setTrackingMessage("GPS ativo. Corrida em andamento.");
          return;
        }

        const previousPoint = lastPointRef.current;
        const deltaKm = haversineDistanceKm(previousPoint, nextPoint);
        const deltaTime = nextPoint.timestamp - previousPoint.timestamp;

        if (deltaKm < 0.005) {
          return;
        }

        if (deltaKm > 0.5 && deltaTime < 15000) {
          return;
        }

        setLiveDistance((current) => current + deltaKm);
        lastPointRef.current = nextPoint;
        setTrackingMessage("GPS ativo. Corrida em andamento.");
      },
      (gpsError) => {
        if (gpsError.code === gpsError.PERMISSION_DENIED) {
          setTrackingMessage("Permissão de localização negada.");
        } else if (gpsError.code === gpsError.POSITION_UNAVAILABLE) {
          setTrackingMessage("Localização indisponível no momento.");
        } else if (gpsError.code === gpsError.TIMEOUT) {
          setTrackingMessage("Tempo esgotado ao tentar obter localização.");
        } else {
          setTrackingMessage("Falha ao acompanhar a corrida.");
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 10000,
      }
    );
  }

  function stopTracking() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (timerIdRef.current !== null) {
      window.clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }

    setIsTracking(false);

    const finalDuration =
      startedAtRef.current !== null
        ? Math.floor((Date.now() - startedAtRef.current) / 1000)
        : trackingSeconds;

    const finalDistance = Number(liveDistance.toFixed(3));

    if (finalDuration > 0 && finalDistance > 0) {
      const run: Run = {
        id: crypto.randomUUID(),
        date: getTodayLocalISO(),
        distance: finalDistance,
        duration: finalDuration,
        source: "gps",
      };

      setRuns((previous) =>
        [run, ...previous].sort((a, b) => b.date.localeCompare(a.date))
      );

      setTrackingMessage("Corrida salva com sucesso.");
    } else {
      setTrackingMessage(
        "Corrida encerrada, mas não havia dados suficientes para salvar."
      );
    }

    startedAtRef.current = null;
    lastPointRef.current = null;
  }

  async function createRunImage(run: Run) {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1350;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      alert("Não foi possível gerar a imagem.");
      return;
    }

    ctx.fillStyle = "#090B0D";
    ctx.fillRect(0, 0, 1080, 1350);

    ctx.fillStyle = "#34D399";
    ctx.fillRect(80, 90, 6, 120);

    try {
      const logo = new Image();

      await new Promise<void>((resolve, reject) => {
        logo.onload = () => resolve();
        logo.onerror = () => reject();
        logo.src = "/icon-512.png";
      });

      ctx.drawImage(logo, 105, 95, 105, 105);
    } catch {
      // segue sem a logo se houver falha
    }

    ctx.textAlign = "left";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 57px Arial";
    ctx.fillText("samks boy", 230, 158);

    ctx.fillStyle = "#9CA3AF";
    ctx.font = "25px Arial";
    ctx.fillText("RUNNING PERFORMANCE", 230, 200);

    ctx.fillStyle = "#30343A";
    ctx.fillRect(80, 290, 920, 2);

    ctx.fillStyle = "#9CA3AF";
    ctx.font = "30px Arial";
    ctx.fillText("DISTÂNCIA PERCORRIDA", 80, 405);

    const km = run.distance.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 145px Arial";
    ctx.fillText(km, 75, 590);

    ctx.fillStyle = "#34D399";
    ctx.font = "bold 55px Arial";
    ctx.fillText("KM", 80, 665);

    ctx.fillStyle = "#171B20";
    ctx.fillRect(80, 760, 445, 245);
    ctx.fillRect(555, 760, 445, 245);

    ctx.fillStyle = "#9CA3AF";
    ctx.font = "27px Arial";
    ctx.fillText("PACE MÉDIO", 110, 830);
    ctx.fillText("TEMPO TOTAL", 585, 830);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 65px Arial";
    ctx.fillText(`${formatPace(run.duration, run.distance)}/km`, 110, 930);
    ctx.fillText(formatTime(run.duration), 585, 930);

    const formattedDate = new Date(`${run.date}T12:00:00`).toLocaleDateString(
      "pt-BR",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );

    ctx.fillStyle = "#A1A1AA";
    ctx.font = "32px Arial";
    ctx.fillText(formattedDate, 80, 1130);

    ctx.fillStyle = "#30343A";
    ctx.fillRect(80, 1190, 920, 2);

    ctx.fillStyle = "#71717A";
    ctx.font = "25px Arial";
    ctx.fillText("SAMKS BOY APP  /  RUNNING", 80, 1250);

    canvas.toBlob((blob) => {
      if (!blob) {
        alert("Não foi possível exportar a imagem.");
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `samks-boy-corrida-${run.date}.png`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 10000);
    }, "image/png");
  }

  const totalDistance = runs.reduce((sum, run) => sum + run.distance, 0);
  const totalDuration = runs.reduce((sum, run) => sum + run.duration, 0);
  const longestRun = runs.reduce((max, run) => Math.max(max, run.distance), 0);

  return (
    <section className="mt-10 space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-400">
          Performance / Running
        </p>

        <h1 className="mt-3 text-3xl font-light text-white">
          Running Tracker
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Registre suas corridas, acompanhe o pace e use GPS em tempo real.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Total de corridas",
            value: runs.length.toString(),
          },
          {
            label: "Distância acumulada",
            value: `${totalDistance.toFixed(2)} km`,
          },
          {
            label: "Pace médio",
            value: `${formatPace(totalDuration, totalDistance)} /km`,
          },
          {
            label: "Maior distância",
            value: `${longestRun.toFixed(2)} km`,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/10 bg-[#141414] p-5"
          >
            <p className="text-xs text-zinc-500">{stat.label}</p>
            <p className="mt-3 text-2xl font-semibold text-white">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-white/10 bg-[#141414] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-medium text-white">
              Corrida em tempo real
            </h2>
            <p className="mt-2 text-sm text-zinc-500">{trackingMessage}</p>
          </div>

          {!isTracking ? (
            <button
              type="button"
              onClick={startTracking}
              className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
            >
              START
            </button>
          ) : (
            <button
              type="button"
              onClick={stopTracking}
              className="rounded-lg bg-red-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-400"
            >
              STOP
            </button>
          )}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-black p-5">
            <p className="text-xs text-zinc-500">Tempo</p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {formatTime(trackingSeconds)}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black p-5">
            <p className="text-xs text-zinc-500">Distância</p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {liveDistance.toFixed(2)} km
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-black p-5">
            <p className="text-xs text-zinc-500">Pace</p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {formatPace(trackingSeconds, liveDistance)} /km
            </p>
          </div>
        </div>

        {!isTracking && (trackingSeconds > 0 || liveDistance > 0) && (
          <button
            type="button"
            onClick={resetTrackingState}
            className="mt-5 rounded-lg border border-white/10 px-4 py-2 text-xs text-zinc-400 hover:text-white"
          >
            Limpar painel ao vivo
          </button>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-[#141414] p-6">
        <h2 className="text-xl font-medium text-white">
          Registrar nova corrida
        </h2>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <label className="space-y-2 text-sm text-zinc-400">
            <span>Data</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black p-3 text-white"
            />
          </label>

          <label className="space-y-2 text-sm text-zinc-400">
            <span>Distância (km)</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="5,20"
              value={distance}
              onChange={(event) => setDistance(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black p-3 text-white"
            />
          </label>

          <label className="space-y-2 text-sm text-zinc-400">
            <span>Minutos</span>
            <input
              type="number"
              min="0"
              placeholder="28"
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black p-3 text-white"
            />
          </label>

          <label className="space-y-2 text-sm text-zinc-400">
            <span>Segundos</span>
            <input
              type="number"
              min="0"
              max="59"
              value={seconds}
              onChange={(event) => setSeconds(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black p-3 text-white"
            />
          </label>
        </div>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

        <button
          type="button"
          onClick={addRun}
          className="mt-6 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
        >
          Salvar corrida
        </button>
      </div>

      <div>
        <h2 className="mb-5 text-xl font-medium text-white">
          Histórico de corridas
        </h2>

        {runs.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nenhuma corrida registrada ainda.
          </p>
        ) : (
          <div className="space-y-3">
            {runs.map((run) => (
              <div
                key={run.id}
                className="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-white/10 bg-[#141414] p-5"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {new Date(`${run.date}T12:00:00`).toLocaleDateString(
                      "pt-BR"
                    )}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {run.source === "gps"
                      ? "Corrida via GPS"
                      : "Corrida registrada manualmente"}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs text-zinc-500">Distância</p>
                    <p className="mt-1 font-medium">
                      {run.distance.toFixed(2)} km
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-500">Pace</p>
                    <p className="mt-1 font-medium">
                      {formatPace(run.duration, run.distance)}/km
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-500">Tempo</p>
                    <p className="mt-1 font-medium">
                      {formatTime(run.duration)}
                    </p>
                  </div>
                </div>

             
<div className="flex flex-col gap-2">
  <button
    type="button"
    onClick={() =>
      setImageMenuId(imageMenuId === run.id ? null : run.id)
    }
    className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/20"
  >
    Criar imagem
  </button>

  {imageMenuId === run.id && (
    <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-black p-3">
      <button
        type="button"
        onClick={() =>
          void exportRunShareImage(run, "black").catch(
            (error) => alert(String(error))
          )
        }
        className="rounded-lg border border-white/20 px-4 py-3 text-xs text-white hover:bg-white/10"
      >
        Baixar arte preta
      </button>

      <button
        type="button"
        onClick={() =>
          void exportRunShareImage(run, "transparent").catch(
            (error) => alert(String(error))
          )
        }
        className="rounded-lg border border-white/20 px-4 py-3 text-xs text-white hover:bg-white/10"
      >
        Baixar arte transparente
      </button>
    </div>
  )}
</div>      
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
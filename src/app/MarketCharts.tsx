
"use client";

import { useEffect, useState } from "react";

type Period = 7 | 30;
type PricePoint = {
  time: number;
  price: number;
};

type Asset = {
  id: string;
  name: string;
  symbol: string;
  color: string;
};

const assets: Asset[] = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "BTC / BRL",
    color: "#f59e0b",
  },
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "ETH / BRL",
    color: "#818cf8",
  },
  {
    id: "solana",
    name: "Solana",
    symbol: "SOL / BRL",
    color: "#34d399",
  },
  {
    id: "dollar",
    name: "Dólar",
    symbol: "USD / BRL",
    color: "#22c55e",
  },
];

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

async function loadPrices(
  id: string,
  days: Period,
  signal: AbortSignal
): Promise<PricePoint[]> {
  if (id === "dollar") {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - days - 2);

    const start = date.toISOString().slice(0, 10);

    const url =
      `https://api.frankfurter.dev/v1/${start}..?base=USD&symbols=BRL`;

    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error("Não foi possível carregar o dólar.");
    }

    const data = await response.json();

    return Object.entries(data.rates ?? {})
      .map(([day, rates]) => ({
        time: new Date(`${day}T12:00:00Z`).getTime(),
        price: (rates as { BRL: number }).BRL,
      }))
      .filter(
        (point) => Number.isFinite(point.price)
      )
      .sort((a, b) => a.time - b.time)
      .slice(-days);
  }

  const url =
    `https://api.coingecko.com/api/v3/coins/${id}/market_chart` +
    `?vs_currency=brl&days=${days}`;

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error("API temporariamente indisponível.");
  }

  const data = await response.json();

  return (data.prices ?? [])
    .map(([time, price]: [number, number]) => ({
      time,
      price,
    }))
    .filter(
      (point: PricePoint) =>
        Number.isFinite(point.time) &&
        Number.isFinite(point.price)
    );
}

function PriceChart({
  asset,
  points,
  loading,
  error,
}: {
  asset: Asset;
  points: PricePoint[];
  loading: boolean;
  error: string;
}) {
  const prices = points.map((point) => point.price);
  const first = prices[0];
  const last = prices[prices.length - 1];

  const change =
    first > 0 ? ((last - first) / first) * 100 : 0;

  const positive = change >= 0;

  const width = 600;
  const height = 220;
  const padding = 18;

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const coordinates = points.map((point, index) => {
    const x =
      padding +
      (index / Math.max(points.length - 1, 1)) *
        (width - padding * 2);

    const y =
      height -
      padding -
      ((point.price - min) / range) *
        (height - padding * 2);

    return `${x},${y}`;
  });

  const line = coordinates.join(" ");

  return (
    <article className="rounded-2xl border border-white/10 bg-[#141414] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {asset.name}
          </h3>

          <p className="mt-1 text-xs text-zinc-500">
            {asset.symbol}
          </p>
        </div>

        {points.length > 1 && (
          <span
            className={`text-sm font-medium ${
              positive ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {positive ? "+" : ""}
            {change.toFixed(2)}%
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
          Carregando gráfico...
        </div>
      ) : error ? (
        <div className="flex h-64 items-center justify-center text-center text-sm text-zinc-500">
          {error}
        </div>
      ) : points.length < 2 ? (
        <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
          Histórico indisponível.
        </div>
      ) : (
        <>
          <p className="mt-5 text-2xl font-semibold text-white">
            {formatBRL(last)}
          </p>

          <div className="mt-5">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="h-auto w-full"
              role="img"
              aria-label={`Gráfico histórico de ${asset.name}`}
            >
              {[25, 75, 125, 175].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2={width}
                  y2={y}
                  stroke="#ffffff"
                  strokeOpacity="0.07"
                />
              ))}

              <polyline
                points={line}
                fill="none"
                stroke={asset.color}
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div className="mt-2 flex justify-between text-xs text-zinc-500">
            <span>
              {new Date(points[0].time).toLocaleDateString(
                "pt-BR"
              )}
            </span>

            <span>
              {new Date(last ? points[points.length - 1].time : 0)
                .toLocaleDateString("pt-BR")}
            </span>
          </div>

          <p className="mt-4 text-xs text-zinc-500">
            Variação no período selecionado
          </p>
        </>
      )}
    </article>
  );
}

export default function MarketCharts() {
  const [period, setPeriod] = useState<Period>(7);

  const [prices, setPrices] = useState<
    Record<string, PricePoint[]>
  >({});

  const [errors, setErrors] = useState<
    Record<string, string>
  >({});

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function updateCharts() {
      setLoading(true);
      setPrices({});
      setErrors({});

      const results = await Promise.allSettled(
        assets.map((asset) =>
          loadPrices(asset.id, period, controller.signal)
        )
      );

      if (controller.signal.aborted) return;

      const nextPrices: Record<string, PricePoint[]> = {};
      const nextErrors: Record<string, string> = {};

      results.forEach((result, index) => {
        const id = assets[index].id;

        if (result.status === "fulfilled") {
          nextPrices[id] = result.value;
        } else {
          nextErrors[id] =
            "Não foi possível carregar. Tente novamente mais tarde.";
        }
      });

      setPrices(nextPrices);
      setErrors(nextErrors);
      setLoading(false);
    }

    updateCharts();

    return () => controller.abort();
  }, [period]);

  return (
    <section className="mt-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-400">
            Market Analytics
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-white">
            Gráficos de mercado
          </h2>

          <p className="mt-2 text-sm text-zinc-500">
            Histórico de preços em reais
          </p>
        </div>

        <div className="flex gap-2">
          {([7, 30] as Period[]).map((days) => (
            <button
              key={days}
              onClick={() => setPeriod(days)}
              className={`rounded-lg border px-4 py-2 text-sm transition ${
                period === days
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                  : "border-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              {days} dias
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {assets.map((asset) => (
          <PriceChart
            key={asset.id}
            asset={asset}
            points={prices[asset.id] ?? []}
            loading={loading}
            error={errors[asset.id] ?? ""}
          />
        ))}
      </div>

      <p className="mt-4 text-xs text-zinc-600">
        Dados históricos: CoinGecko e Frankfurter.
        A cotação histórica do dólar é uma taxa de referência.
      </p>
    </section>
  );
}

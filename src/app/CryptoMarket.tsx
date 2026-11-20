
"use client";

import { useCallback, useEffect, useState } from "react";

type CoinId = "bitcoin" | "ethereum" | "solana";

type CoinPrice = {
  brl: number;
  brl_24h_change?: number;
};

type MarketData = Partial<Record<CoinId, CoinPrice>>;

const COINS: {
  id: CoinId;
  name: string;
  symbol: string;
  icon: string;
}[] = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC", icon: "₿" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH", icon: "Ξ" },
  { id: "solana", name: "Solana", symbol: "SOL", icon: "◎" },
];

const API_URL =
  "https://api.coingecko.com/api/v3/simple/price" +
  "?ids=bitcoin,ethereum,solana" +
  "&vs_currencies=brl" +
  "&include_24hr_change=true";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function CryptoMarket() {
  const [market, setMarket] = useState<MarketData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const loadPrices = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`API retornou ${response.status}`);
      }

      const data: unknown = await response.json();

      if (
        data === null ||
        typeof data !== "object" ||
        Array.isArray(data)
      ) {
        throw new Error("Resposta inválida");
      }

      const result = data as Record<string, unknown>;
      const validated: MarketData = {};

      for (const coin of COINS) {
        const raw = result[coin.id];

        if (
          raw === null ||
          typeof raw !== "object" ||
          Array.isArray(raw)
        ) {
          throw new Error(`Dados indisponíveis: ${coin.name}`);
        }

        const item = raw as Record<string, unknown>;

        if (
          typeof item.brl !== "number" ||
          !Number.isFinite(item.brl) ||
          item.brl <= 0
        ) {
          throw new Error(`Preço inválido: ${coin.name}`);
        }

        validated[coin.id] = {
          brl: item.brl,
          brl_24h_change:
            typeof item.brl_24h_change === "number" &&
            Number.isFinite(item.brl_24h_change)
              ? item.brl_24h_change
              : undefined,
        };
      }

      setMarket(validated);
      setUpdatedAt(new Date());
    } catch (err) {
      console.error("Erro ao consultar criptomoedas:", err);
      setError(
        "Não foi possível atualizar as cotações. A fonte pode estar temporariamente indisponível."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void loadPrices();
    }, 0);

    const interval = window.setInterval(() => {
      void loadPrices();
    }, 120000);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [loadPrices]);

  return (
    <section className="mt-12">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs tracking-[0.25em] text-zinc-500">
            LIVE MARKET DATA
          </p>

          <h3 className="mt-3 text-2xl font-light">
            Crypto Market
          </h3>

          <p className="mt-2 text-sm text-zinc-500">
            Acompanhe as cotações de criptomoedas em reais.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadPrices()}
          disabled={loading}
          className="border border-white/20 px-5 py-3 text-xs tracking-widest text-zinc-300 transition hover:bg-white/10 disabled:opacity-50"
        >
          {loading ? "ATUALIZANDO..." : "ATUALIZAR PREÇOS ↻"}
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
        <span>
          {error
            ? "● FALHA NA ATUALIZAÇÃO"
            : loading
              ? "● CONSULTANDO MERCADO"
              : updatedAt
                ? "● DADOS RECEBIDOS"
                : "● AGUARDANDO DADOS"}
        </span>

        <span>
          {updatedAt
            ? `Última consulta: ${updatedAt.toLocaleTimeString("pt-BR")}`
            : "Nenhuma consulta concluída"}
        </span>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400"
        >
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {COINS.map((coin) => {
          const data = market[coin.id];
          const change = data?.brl_24h_change;
          const hasChange = change !== undefined;
          const positive = hasChange && change >= 0;

          return (
            <div
              key={coin.id}
              className="border border-white/10 bg-[#141414] p-6"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-[#202020] text-2xl">
                  {coin.icon}
                </div>

                <div>
                  <h4 className="text-lg font-medium">
                    {coin.name}
                  </h4>

                  <p className="mt-1 text-xs tracking-widest text-zinc-500">
                    {coin.symbol} / BRL
                  </p>
                </div>
              </div>

              <div className="mt-9">
                <p className="text-xs tracking-widest text-zinc-500">
                  PREÇO DE MERCADO
                </p>

                <p className="mt-3 text-2xl font-light sm:text-3xl">
                  {data ? formatBRL(data.brl) : "—"}
                </p>
              </div>

              <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5">
                <span className="text-xs text-zinc-500">
                  VARIAÇÃO 24H
                </span>

                <span
                  className={`text-sm font-medium ${
                    !hasChange
                      ? "text-zinc-500"
                      : positive
                        ? "text-emerald-400"
                        : "text-red-400"
                  }`}
                >
                  {hasChange
                    ? `${positive ? "+" : ""}${change.toFixed(2)}%`
                    : "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 border-t border-white/10 pt-5">
        <p className="text-xs leading-6 text-zinc-500">
          Fonte: CoinGecko. Atualização automática a cada
          2 minutos enquanto a página estiver aberta.
          Os preços podem sofrer atrasos e não representam
          ofertas garantidas de compra ou venda.
        </p>
      </div>
    </section>
  );
}

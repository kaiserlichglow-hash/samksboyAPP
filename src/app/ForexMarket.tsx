
"use client";

import { useCallback, useEffect, useState } from "react";

type Currency = {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  key: string;
};

type Quote = {
  bid: string;
  pctChange: string;
  create_date: string;
  timestamp?: string;
};

const CURRENCIES: Currency[] = [
  {
    code: "USD",
    name: "Dólar Americano",
    symbol: "USD / BRL",
    flag: "🇺🇸",
    key: "USDBRL",
  },
  {
    code: "EUR",
    name: "Euro",
    symbol: "EUR / BRL",
    flag: "🇪🇺",
    key: "EURBRL",
  },
];

const API_URL =
  "https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value);
}

export default function ForexMarket() {
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  const loadQuotes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(API_URL, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}`);
      }

      const data: unknown = await response.json();

      if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
      ) {
        throw new Error("Resposta inválida");
      }

      const result = data as Record<string, unknown>;
      const validQuotes: Record<string, Quote> = {};

      for (const currency of CURRENCIES) {
        const raw = result[currency.key];

        if (
          !raw ||
          typeof raw !== "object" ||
          Array.isArray(raw)
        ) {
          throw new Error(`Cotação ausente: ${currency.code}`);
        }

        const quote = raw as Record<string, unknown>;

        if (
          typeof quote.bid !== "string" ||
          !Number.isFinite(Number(quote.bid)) ||
          Number(quote.bid) <= 0
        ) {
          throw new Error(`Preço inválido: ${currency.code}`);
        }

        validQuotes[currency.key] = {
          bid: quote.bid,
          pctChange:
            typeof quote.pctChange === "string"
              ? quote.pctChange
              : "",
          create_date:
            typeof quote.create_date === "string"
              ? quote.create_date
              : "",
          timestamp:
            typeof quote.timestamp === "string"
              ? quote.timestamp
              : undefined,
        };
      }

      setQuotes(validQuotes);
      setUpdatedAt(new Date().toLocaleTimeString("pt-BR"));
    } catch (err) {
      console.error("Erro ao consultar câmbio:", err);
      setError("Não foi possível atualizar dólar e euro.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      void loadQuotes();
    }, 0);

    const interval = window.setInterval(() => {
      void loadQuotes();
    }, 120000);

    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, [loadQuotes]);

  return (
    <section className="mt-12">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs tracking-[0.25em] text-zinc-500">
            FOREIGN EXCHANGE MARKET
          </p>

          <h3 className="mt-3 text-2xl font-light">
            Dólar & Euro
          </h3>

          <p className="mt-2 text-sm text-zinc-500">
            Cotações das principais moedas internacionais.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadQuotes()}
          disabled={loading}
          className="border border-white/20 px-5 py-3 text-xs tracking-widest text-zinc-300 transition hover:bg-white/10 disabled:opacity-50"
        >
          {loading ? "ATUALIZANDO..." : "ATUALIZAR COTAÇÕES ↻"}
        </button>
      </div>

      {error && (
        <p role="alert" className="mb-5 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {CURRENCIES.map((currency) => {
          const quote = quotes[currency.key];
          const price = quote ? Number(quote.bid) : null;
          const change = quote
            ? Number(quote.pctChange)
            : null;
          const validChange =
            quote?.pctChange !== "" &&
            change !== null &&
            Number.isFinite(change);

          return (
            <div
              key={currency.code}
              className="border border-white/10 bg-[#141414] p-6"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-[#202020] text-2xl">
                  {currency.flag}
                </div>

                <div>
                  <h4 className="text-lg font-medium">
                    {currency.name}
                  </h4>
                  <p className="mt-1 text-xs tracking-widest text-zinc-500">
                    {currency.symbol}
                  </p>
                </div>
              </div>

              <div className="mt-8">
                <p className="text-xs tracking-widest text-zinc-500">
                  COTAÇÃO EM REAIS
                </p>

                <p className="mt-3 text-3xl font-light">
                  {price !== null ? formatBRL(price) : "—"}
                </p>
              </div>

              <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-5">
                <span className="text-xs text-zinc-500">
                  VARIAÇÃO INFORMADA
                </span>

                <span
                  className={`text-sm font-medium ${
                    !validChange
                      ? "text-zinc-500"
                      : change >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                  }`}
                >
                  {validChange
                    ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`
                    : "—"}
                </span>
              </div>

              <p className="mt-4 text-xs text-zinc-600">
                {quote?.create_date
                  ? `Cotação da fonte: ${quote.create_date}`
                  : "Aguardando horário da cotação"}
              </p>
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-xs leading-6 text-zinc-500">
        Fonte: AwesomeAPI. Atualização automática a cada
        2 minutos, com possíveis atrasos da fonte.
        {updatedAt && ` Última consulta: ${updatedAt}.`}
        {" "}Valores indicativos, sujeitos a diferenças
        em bancos e casas de câmbio.
      </p>
    </section>
  );
}

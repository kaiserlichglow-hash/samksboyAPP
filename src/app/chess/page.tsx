
"use client";

import { useEffect, useState } from "react";
import { Chess, type Move, type Square } from "chess.js";
import Link from "next/link";


type Level = 500 | 1500 | 2500;
type Color = "w" | "b";

const PIECES: Record<string, string> = {
  wk: "♔", wq: "♕", wr: "♖",
  wb: "♗", wn: "♘", wp: "♙",
  bk: "♚", bq: "♛", br: "♜",
  bb: "♝", bn: "♞", bp: "♟",
};

const VALUES: Record<string, number> = {
  p: 100, n: 320, b: 330,
  r: 500, q: 900, k: 0,
};

function cloneGame(game: Chess) {
  const copy = new Chess();
  copy.loadPgn(game.pgn());
  return copy;
}

function evaluate(game: Chess) {
  if (game.isCheckmate()) {
    return game.turn() === "w" ? -100000 : 100000;
  }

  if (game.isDraw()) return 0;

  let score = 0;

  for (const row of game.board()) {
    for (const piece of row) {
      if (!piece) continue;

      const value = VALUES[piece.type] ?? 0;
      score += piece.color === "w" ? value : -value;
    }
  }

  return score;
}

function search(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number
): number {
  if (depth === 0 || game.isGameOver()) {
    return evaluate(game);
  }

  const maximizing = game.turn() === "w";
  let best = maximizing ? -Infinity : Infinity;

  const moves = game.moves({ verbose: true });

  moves.sort((a, b) => {
    const aValue = a.captured
      ? VALUES[a.captured] ?? 0
      : 0;
    const bValue = b.captured
      ? VALUES[b.captured] ?? 0
      : 0;

    return bValue - aValue;
  });

  for (const move of moves) {
    game.move(move);

    const score = search(
      game,
      depth - 1,
      alpha,
      beta
    );

    game.undo();

    if (maximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, best);
    }

    if (beta <= alpha) break;
  }

  return best;
}

function chooseBotMove(
  game: Chess,
  level: Level
): Move | null {
  const moves = game.moves({ verbose: true });

  if (moves.length === 0) return null;

  if (level === 500) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  const depth = level === 1500 ? 2 : 3;
  const maximizing = game.turn() === "w";

  let bestScore = maximizing ? -Infinity : Infinity;
  let bestMoves: Move[] = [];

  for (const move of moves) {
    game.move(move);

    const score = search(
      game,
      depth - 1,
      -Infinity,
      Infinity
    );

    game.undo();

    const better = maximizing
      ? score > bestScore
      : score < bestScore;

    if (better) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return bestMoves[
    Math.floor(Math.random() * bestMoves.length)
  ] ?? moves[0];
}

export default function ChessPage() {
  const [game, setGame] = useState(() => new Chess());
  const [level, setLevel] = useState<Level>(500);
  const [playerColor, setPlayerColor] = useState<Color>("w");

  const [selected, setSelected] = useState<Square | null>(
    null
  );

  const [promotion, setPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);

  const [thinking, setThinking] = useState(false);

  const botColor: Color =
    playerColor === "w" ? "b" : "w";

  const botTurn =
    game.turn() === botColor && !game.isGameOver();

  useEffect(() => {
    if (!botTurn) return;

    const timer = window.setTimeout(() => {
      setThinking(true);

      window.setTimeout(() => {
        setGame((current) => {
          if (
            current.isGameOver() ||
            current.turn() !== botColor
          ) {
            return current;
          }

          const next = cloneGame(current);
          const move = chooseBotMove(next, level);

          if (move) next.move(move);

          return next;
        });

        setThinking(false);
      }, 50);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [botTurn, botColor, level, game]);

  const legalMoves = selected
    ? game.moves({
        square: selected,
        verbose: true,
      })
    : [];

  const legalTargets = legalMoves.map(
    (move) => move.to
  );

  function playMove(
    from: Square,
    to: Square,
    promotedPiece = "q"
  ) {
    if (thinking || botTurn || game.isGameOver()) return;

    const next = cloneGame(game);

    try {
      next.move({
        from,
        to,
        promotion: promotedPiece,
      });

      setGame(next);
      setSelected(null);
      setPromotion(null);
    } catch {
      setSelected(null);
    }
  }

  function selectSquare(square: Square) {
    if (
      thinking ||
      botTurn ||
      game.isGameOver() ||
      promotion
    ) {
      return;
    }

    const piece = game.get(square);

    if (selected && legalTargets.includes(square)) {
      const choices = legalMoves.filter(
        (move) => move.to === square
      );

      if (choices.some((move) => move.isPromotion())) {
        setPromotion({ from: selected, to: square });
        return;
      }

      playMove(selected, square);
      return;
    }

    if (piece && piece.color === playerColor) {
      setSelected(square === selected ? null : square);
    } else {
      setSelected(null);
    }
  }

  function newGame(nextLevel = level, nextColor = playerColor) {
    setLevel(nextLevel);
    setPlayerColor(nextColor);
    setGame(new Chess());
    setSelected(null);
    setPromotion(null);
    setThinking(false);
  }

  function undoTurn() {
    if (thinking || botTurn) return;

    const next = cloneGame(game);

    next.undo();

    if (next.turn() !== playerColor) {
      next.undo();
    }

    setGame(next);
    setSelected(null);
    setPromotion(null);
  }

  function getStatus() {
    if (game.isCheckmate()) {
      return game.turn() === playerColor
        ? "Xeque-mate — o bot venceu."
        : "Xeque-mate — você venceu!";
    }

    if (game.isDraw()) return "Partida empatada.";
    if (thinking || botTurn) return "O bot está pensando...";
    if (game.isCheck()) return "Seu rei está em xeque!";

    return "Sua vez de jogar.";
  }

  const ranks =
    playerColor === "w"
      ? [8, 7, 6, 5, 4, 3, 2, 1]
      : [1, 2, 3, 4, 5, 6, 7, 8];

  const files =
    playerColor === "w"
      ? "abcdefgh".split("")
      : "hgfedcba".split("");

  const history = game.history();

  return (
    <main className="min-h-screen bg-[#090909] px-4 py-8 text-zinc-100 md:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs tracking-[0.3em] text-zinc-500">
              SAMKS BOY APP
            </p>

            <h1 className="mt-2 text-3xl font-light">
              Chess Arena
            </h1>
          </div>

          <Link
            href="/"
            className="border border-white/20 px-5 py-3 text-sm text-zinc-300 hover:bg-white/10"
          >
            ← Voltar ao painel
          </Link>
        </header>

        <section className="mt-8">
          <p className="text-xs tracking-widest text-zinc-500">
            ESCOLHA A DIFICULDADE
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {([500, 1500, 2500] as Level[]).map(
              (rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => newGame(rating)}
                  className={`border p-5 text-left transition ${
                    level === rating
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-white/10 bg-[#141414] hover:border-white/30"
                  }`}
                >
                  <p className="text-3xl font-light">
                    {rating}
                  </p>

                  <p className="mt-2 text-xs text-zinc-500">
                    {rating === 500
                      ? "INICIANTE"
                      : rating === 1500
                        ? "INTERMEDIÁRIO"
                        : "AVANÇADO"}
                  </p>
                </button>
              )
            )}
          </div>

          <p className="mt-3 text-xs text-zinc-600">
            Níveis experimentais. Os valores não são Elo oficial.
          </p>
        </section>

        <section className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,640px)_1fr]">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm text-zinc-400">
                Você vs. Computador
              </p>

              <span className="text-xs text-emerald-400">
                {getStatus()}
              </span>
            </div>

            <div className="grid aspect-square w-full grid-cols-8 overflow-hidden border border-white/20">
              {ranks.flatMap((rank) =>
                files.map((file) => {
                  const square = `${file}${rank}` as Square;
                  const piece = game.get(square);

                  const fileIndex =
                    "abcdefgh".indexOf(file);

                  const light =
                    (fileIndex + rank) % 2 === 0;

                  const isSelected = selected === square;
                  const isLegal =
                    legalTargets.includes(square);

                  const symbol = piece
                    ? PIECES[piece.color + piece.type]
                    : "";

                  return (
                    <button
                      key={square}
                      type="button"
                      aria-label={`Casa ${square}`}
                      onClick={() => selectSquare(square)}
                      className={`relative flex aspect-square items-center justify-center ${
                        light
                          ? "bg-[#d9d5cb]"
                          : "bg-[#77786f]"
                      } ${
                        isSelected
                          ? "ring-4 ring-inset ring-amber-400"
                          : ""
                      }`}
                    >
                      <span
                        className={`relative z-10 select-none text-[clamp(25px,5vw,58px)] leading-none ${
                          piece?.color === "w"
                            ? "text-white [text-shadow:0_2px_2px_#111,1px_0_2px_#111]"
                            : "text-[#151515] [text-shadow:0_1px_1px_#eee]"
                        }`}
                      >
                        {symbol}
                      </span>

                      {isLegal && (
                        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                          <span className={`rounded-full ${
                            piece
                              ? "h-[85%] w-[85%] border-4 border-emerald-700/60"
                              : "h-3 w-3 bg-emerald-700/50"
                          }`} />
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {promotion && (
              <div className="mt-4 border border-white/20 bg-[#141414] p-4">
                <p className="mb-3 text-sm">
                  Escolha a peça para promoção:
                </p>

                <div className="flex flex-wrap gap-2">
                  {[
                    ["q", "Dama"],
                    ["r", "Torre"],
                    ["b", "Bispo"],
                    ["n", "Cavalo"],
                  ].map(([piece, label]) => (
                    <button
                      key={piece}
                      type="button"
                      onClick={() =>
                        playMove(
                          promotion.from,
                          promotion.to,
                          piece
                        )
                      }
                      className="border border-white/20 px-4 py-2 text-sm hover:bg-white/10"
                    >
                      {label}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setPromotion(null)}
                    className="border border-white/10 px-4 py-2 text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => newGame()}
                className="bg-white px-5 py-3 text-sm font-medium text-black hover:bg-zinc-300"
              >
                Nova partida
              </button>

              <button
                type="button"
                onClick={undoTurn}
                disabled={
                  history.length === 0 ||
                  thinking ||
                  botTurn
                }
                className="border border-white/20 px-5 py-3 text-sm disabled:opacity-40"
              >
                Desfazer jogada
              </button>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="border border-white/10 bg-[#141414] p-6">
              <p className="text-xs tracking-widest text-zinc-500">
                GAME SETTINGS
              </p>

              <h2 className="mt-4 text-xl">
                Configurações
              </h2>

              <p className="mt-6 text-sm text-zinc-400">
                Jogar com:
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => newGame(level, "w")}
                  className={`border p-3 text-sm ${
                    playerColor === "w"
                      ? "border-emerald-500 text-emerald-400"
                      : "border-white/10"
                  }`}
                >
                  ♔ Brancas
                </button>

                <button
                  type="button"
                  onClick={() => newGame(level, "b")}
                  className={`border p-3 text-sm ${
                    playerColor === "b"
                      ? "border-emerald-500 text-emerald-400"
                      : "border-white/10"
                  }`}
                >
                  ♚ Pretas
                </button>
              </div>

              <p className="mt-5 text-xs leading-6 text-zinc-500">
                Alterar a dificuldade ou a cor inicia
                uma nova partida.
              </p>
            </div>

            <div className="border border-white/10 bg-[#141414] p-6">
              <p className="text-xs tracking-widest text-zinc-500">
                MOVE HISTORY
              </p>

              <h2 className="mt-3 text-xl">
                Histórico de jogadas
              </h2>

              <div className="mt-5 max-h-72 overflow-y-auto font-mono text-sm text-zinc-400">
                {history.length === 0 ? (
                  <p className="text-zinc-600">
                    Nenhuma jogada ainda.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {history.map((move, index) => (
                      <div key={index}>
                        <span className="text-zinc-600">
                          {index % 2 === 0
                            ? `${Math.floor(index / 2) + 1}. `
                            : ""}
                        </span>
                        {move}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </section>

        <footer className="mt-12 border-t border-white/10 pt-5 text-xs tracking-widest text-zinc-600">
          SAMKS BOY APP / CHESS ARENA
        </footer>
      </div>
    </main>
  );
}

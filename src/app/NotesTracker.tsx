
"use client";

import { useEffect, useState } from "react";
import {
  NotebookPen,
  Plus,
  Search,
  Trash2,
  Check,
} from "lucide-react";

type Note = {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
};

const STORAGE_KEY = "samksboyapp-notes-v1";

export default function NotesTracker() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          setNotes(parsed);
        }
      }
    } catch {
      setNotes([]);
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }, [notes, loaded]);

  function createNote() {
    const id = crypto.randomUUID();

    const note: Note = {
      id,
      title: "",
      content: "",
      updatedAt: new Date().toISOString(),
    };

    setNotes((previous) => [note, ...previous]);
    setSelectedId(id);
    setSearch("");
  }

  function updateNote(
    id: string,
    field: "title" | "content",
    value: string
  ) {
    setNotes((previous) =>
      previous.map((note) =>
        note.id === id
          ? {
              ...note,
              [field]: value,
              updatedAt: new Date().toISOString(),
            }
          : note
      )
    );
  }

  function deleteNote(id: string) {
    const confirmed = window.confirm(
      "Deseja excluir esta nota permanentemente?"
    );

    if (!confirmed) return;

    setNotes((previous) =>
      previous.filter((note) => note.id !== id)
    );

    if (selectedId === id) {
      setSelectedId(null);
    }
  }

  const selected = notes.find(
    (note) => note.id === selectedId
  );

  const filteredNotes = notes
    .filter((note) =>
      `${note.title} ${note.content}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
    .sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );

  return (
    <section className="mt-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
            SAMKS BOY / NOTES
          </p>

          <h1 className="mt-3 text-3xl font-light text-white">
            Minhas notas
          </h1>

          <p className="mt-2 text-sm text-zinc-500">
            Ideias, pensamentos, objetivos e projetos.
          </p>
        </div>

        <button
          type="button"
          onClick={createNote}
          disabled={!loaded}
          className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-50"
        >
          <Plus size={18} />
          Nova nota
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <div className="rounded-3xl border border-white/10 bg-[#141414] p-5">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/50 px-4 py-3">
            <Search size={18} className="text-zinc-500" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar notas..."
              className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
            />
          </div>

          <p className="mt-5 text-xs text-zinc-500">
            {notes.length} nota(s)
          </p>

          <div className="mt-4 space-y-2">
            {filteredNotes.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">
                Nenhuma nota encontrada.
              </p>
            ) : (
              filteredNotes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => setSelectedId(note.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    selectedId === note.id
                      ? "border-white/40 bg-white/10"
                      : "border-white/10 bg-black/30 hover:border-white/25"
                  }`}
                >
                  <p className="truncate text-sm font-medium text-white">
                    {note.title.trim() || "Sem título"}
                  </p>

                  <p className="mt-2 line-clamp-2 text-xs text-zinc-500">
                    {note.content.trim() || "Nota vazia"}
                  </p>

                  <p className="mt-3 text-xs text-zinc-600">
                    {new Date(note.updatedAt).toLocaleDateString(
                      "pt-BR"
                    )}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="min-h-[450px] rounded-3xl border border-white/10 bg-[#141414] p-5 md:p-7">
          {selected ? (
            <div className="flex h-full flex-col">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Check size={16} />
                  Salvamento automático
                </div>

                <button
                  type="button"
                  onClick={() => deleteNote(selected.id)}
                  className="flex items-center gap-2 rounded-xl border border-red-500/20 px-3 py-2 text-xs text-red-400 transition hover:bg-red-500/10"
                >
                  <Trash2 size={15} />
                  Excluir
                </button>
              </div>

              <input
                value={selected.title}
                onChange={(event) =>
                  updateNote(
                    selected.id,
                    "title",
                    event.target.value
                  )
                }
                placeholder="Título da nota"
                className="mt-8 w-full bg-transparent text-2xl font-medium text-white outline-none placeholder:text-zinc-600"
              />

              <div className="my-6 border-t border-white/10" />

              <textarea
                value={selected.content}
                onChange={(event) =>
                  updateNote(
                    selected.id,
                    "content",
                    event.target.value
                  )
                }
                placeholder="Comece a escrever..."
                className="min-h-[300px] w-full flex-1 resize-y bg-transparent text-sm leading-7 text-zinc-200 outline-none placeholder:text-zinc-600"
              />
            </div>
          ) : (
            <div className="flex h-full min-h-[390px] flex-col items-center justify-center gap-4 text-center">
              <NotebookPen
                size={42}
                strokeWidth={1.3}
                className="text-zinc-500"
              />

              <h2 className="text-lg font-medium text-white">
                Seu espaço de ideias
              </h2>

              <p className="max-w-sm text-sm text-zinc-500">
                Selecione uma nota ou clique em Nova nota
                para começar a escrever.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

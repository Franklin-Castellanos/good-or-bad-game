"use client";

import { useEffect, useMemo, useState } from "react";
import {
  advanceRound,
  completeRound,
  createGame,
  createPlayer,
  getCurrentRound,
  getSortedScores,
  getWinnerIdsByScore,
  resolveTieBreaker,
} from "@/lib/game/game";
import type { GameState, Guess, Player, TieBreaker } from "@/lib/game/types";

const STORAGE_KEY = "good-or-bad-game-state";

const emptyGame: GameState = {
  phase: "home",
  players: [],
  totalRounds: 0,
  turnOrder: [],
  currentRoundIndex: 0,
  rounds: [],
  scores: {},
};

export function GameApp() {
  const [game, setGame] = useState<GameState>(emptyGame);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const storedGame = readStoredGame();
    // Loading persisted browser state is the intended external sync for this client-only game.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGame(storedGame);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  }, [game, loaded]);

  const resetGame = () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setGame(emptyGame);
  };

  if (!loaded) {
    return <Shell title="Good or Bad Game">Cargando partida...</Shell>;
  }

  return (
    <Shell title="Good or Bad Game">
      <ScaleBar />

      {game.phase === "home" && (
        <HomeScreen onCreate={() => setGame({ ...emptyGame, phase: "setup" })} />
      )}

      {game.phase === "setup" && (
        <SetupScreen
          onStart={(players, totalRounds) => setGame(createGame(players, totalRounds))}
        />
      )}

      {game.phase === "clue" && (
        <ClueScreen
          game={game}
          onChange={(nextGame) => setGame(nextGame)}
          onShowClue={() => setGame({ ...game, phase: "guess" })}
          onReset={resetGame}
        />
      )}

      {game.phase === "guess" && (
        <GuessScreen
          game={game}
          onReveal={(guesses) => setGame(completeRound(game, guesses))}
          onBack={() => setGame({ ...game, phase: "clue" })}
        />
      )}

      {game.phase === "result" && (
        <RoundResultScreen
          game={game}
          onNext={() => setGame(advanceRound(game))}
          onReset={resetGame}
        />
      )}

      {game.phase === "final" && (
        <FinalScreen game={game} onReset={resetGame} />
      )}

      {game.phase === "tiebreaker-clues" && game.tieBreaker && (
        <TieBreakerCluesScreen
          game={game}
          tieBreaker={game.tieBreaker}
          onContinue={(tieBreaker) =>
            setGame({ ...game, phase: "tiebreaker-vote", tieBreaker })
          }
        />
      )}

      {game.phase === "tiebreaker-vote" && game.tieBreaker && (
        <TieBreakerVoteScreen
          game={game}
          tieBreaker={game.tieBreaker}
          onFinish={(tieBreaker) =>
            setGame({
              ...game,
              phase: "tiebreaker-result",
              tieBreaker: resolveTieBreaker(tieBreaker),
            })
          }
        />
      )}

      {game.phase === "tiebreaker-result" && game.tieBreaker && (
        <FinalScreen game={game} onReset={resetGame} tieBreaker={game.tieBreaker} />
      )}
    </Shell>
  );
}

function readStoredGame() {
  if (typeof window === "undefined") return emptyGame;

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) return emptyGame;

  try {
    return JSON.parse(saved) as GameState;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return emptyGame;
  }
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-coral">
            Juego social
          </p>
          <h1 className="text-4xl font-black text-ink sm:text-5xl">{title}</h1>
        </div>
        <p className="max-w-md text-sm leading-6 text-slate-600">
          Da una pista ambigua, deja que el grupo lea la intención y descubre si
          estaban cerca del 1 al 10.
        </p>
      </header>
      {children}
    </main>
  );
}

function HomeScreen({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="grid gap-5 rounded-lg bg-white p-6 shadow-soft sm:p-8">
      <div className="grid gap-3">
        <h2 className="text-2xl font-black text-ink">¿Bueno, malo o algo raro?</h2>
        <p className="max-w-2xl leading-7 text-slate-600">
          Un jugador recibe un número secreto y escribe una pista. El resto
          intenta adivinar qué tan buena o mala era la idea. Gana quien lea mejor
          las pistas y quien sepa darlas con el punto justo de misterio.
        </p>
      </div>
      <button className="btn-primary w-full sm:w-fit" onClick={onCreate}>
        Crear partida
      </button>
    </section>
  );
}

function SetupScreen({
  onStart,
}: {
  onStart: (players: Player[], totalRounds: number) => void;
}) {
  const [playerCount, setPlayerCount] = useState(4);
  const [names, setNames] = useState(["Laura", "Andrés", "Camila", "Mateo"]);
  const [rounds, setRounds] = useState(8);
  const [error, setError] = useState("");

  const visibleNames = useMemo(() => {
    return Array.from({ length: playerCount }, (_, index) => names[index] ?? "");
  }, [names, playerCount]);

  const turnPreview = Array.from({ length: rounds }, (_, index) => {
    return visibleNames[index % Math.max(visibleNames.length, 1)] || `Jugador ${index + 1}`;
  });

  const updatePlayerCount = (count: number) => {
    const safeCount = Math.max(2, Math.min(12, count));
    setPlayerCount(safeCount);
    setNames((current) =>
      Array.from({ length: safeCount }, (_, index) => current[index] ?? ""),
    );
  };

  const submit = () => {
    const trimmedNames = visibleNames.map((name) => name.trim());
    if (playerCount < 2) return setError("Necesitas mínimo 2 jugadores.");
    if (rounds < 1) return setError("Necesitas mínimo 1 ronda.");
    if (trimmedNames.some((name) => !name)) {
      return setError("Todos los jugadores deben tener nombre.");
    }

    onStart(trimmedNames.map(createPlayer), rounds);
  };

  return (
    <section className="grid gap-5 rounded-lg bg-white p-5 shadow-soft sm:p-7">
      <div>
        <h2 className="text-2xl font-black text-ink">Configurar partida</h2>
        <p className="text-sm text-slate-600">
          El orden se reparte en ciclo para que los turnos queden lo más parejos posible.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cantidad de jugadores">
          <input
            className="input"
            min={2}
            max={12}
            type="number"
            value={playerCount}
            onChange={(event) => updatePlayerCount(Number(event.target.value))}
          />
        </Field>
        <Field label="Cantidad de rondas">
          <input
            className="input"
            min={1}
            type="number"
            value={rounds}
            onChange={(event) => setRounds(Math.max(1, Number(event.target.value)))}
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {visibleNames.map((name, index) => (
          <Field key={index} label={`Jugador ${index + 1}`}>
            <input
              className="input"
              value={name}
              onChange={(event) => {
                const next = [...names];
                next[index] = event.target.value;
                setNames(next);
              }}
            />
          </Field>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-3 font-bold text-ink">Vista previa de turnos</h3>
        <div className="flex flex-wrap gap-2">
          {turnPreview.map((name, index) => (
            <span key={`${name}-${index}`} className="badge">
              R{index + 1}: {name}
            </span>
          ))}
        </div>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <button className="btn-primary" onClick={submit}>
        Iniciar partida
      </button>
    </section>
  );
}

function ClueScreen({
  game,
  onChange,
  onShowClue,
  onReset,
}: {
  game: GameState;
  onChange: (game: GameState) => void;
  onShowClue: () => void;
  onReset: () => void;
}) {
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState("");
  const round = getCurrentRound(game);
  const activePlayer = findPlayer(game, round.activePlayerId);

  const updateClue = (clue: string) => {
    const rounds = [...game.rounds];
    rounds[game.currentRoundIndex] = { ...round, clue };
    onChange({ ...game, rounds });
  };

  return (
    <section className="grid gap-5 rounded-lg bg-white p-5 shadow-soft sm:p-7">
      <RoundHeader game={game} activePlayer={activePlayer} />

      <div className="rounded-lg border border-dashed border-coral/50 bg-coral/5 p-4">
        <p className="text-sm font-bold text-coral">Solo para {activePlayer.name}</p>
        <button
          className="btn-secondary mt-3"
          onClick={() => setShowSecret((current) => !current)}
        >
          {showSecret ? "Ocultar número secreto" : "Revelar número secreto"}
        </button>
        {showSecret && (
          <p className="mt-4 text-6xl font-black text-coral">{round.secretNumber}</p>
        )}
      </div>

      <Field label="Pista del jugador activo">
        <textarea
          className="input min-h-32 resize-y"
          placeholder="Ej: Es alguien que te ayuda a mudarte un domingo, pero llega tarde..."
          value={round.clue}
          onChange={(event) => updateClue(event.target.value)}
        />
      </Field>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          className="btn-primary"
          onClick={() => {
            if (!round.clue.trim()) {
              setError("Escribe una pista antes de mostrarla al grupo.");
              return;
            }
            onShowClue();
          }}
        >
          Mostrar pista al grupo
        </button>
        <button className="btn-ghost" onClick={onReset}>
          Reiniciar partida
        </button>
      </div>
    </section>
  );
}

function GuessScreen({
  game,
  onReveal,
  onBack,
}: {
  game: GameState;
  onReveal: (guesses: Guess[]) => void;
  onBack: () => void;
}) {
  const round = getCurrentRound(game);
  const guessingPlayers = game.players.filter((player) => player.id !== round.activePlayerId);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  const reveal = () => {
    const guesses = guessingPlayers.map((player) => ({
      playerId: player.id,
      value: Number(answers[player.id]),
    }));

    if (guesses.some((guess) => !Number.isInteger(guess.value))) {
      return setError("Todos los jugadores deben ingresar una respuesta.");
    }

    if (guesses.some((guess) => guess.value < 1 || guess.value > 10)) {
      return setError("Todas las respuestas deben estar entre 1 y 10.");
    }

    onReveal(guesses);
  };

  return (
    <section className="grid gap-5 rounded-lg bg-white p-5 shadow-soft sm:p-7">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-mint">
          Pista al grupo
        </p>
        <blockquote className="mt-2 rounded-lg border-l-4 border-mint bg-mint/5 p-4 text-lg font-semibold text-ink">
          {round.clue}
        </blockquote>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {guessingPlayers.map((player) => (
          <Field key={player.id} label={player.name}>
            <input
              className="input"
              min={1}
              max={10}
              type="number"
              placeholder="1-10"
              value={answers[player.id] ?? ""}
              onChange={(event) =>
                setAnswers({ ...answers, [player.id]: event.target.value })
              }
            />
          </Field>
        ))}
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button className="btn-primary" onClick={reveal}>
          Revelar resultado
        </button>
        <button className="btn-ghost" onClick={onBack}>
          Editar pista
        </button>
      </div>
    </section>
  );
}

function RoundResultScreen({
  game,
  onNext,
  onReset,
}: {
  game: GameState;
  onNext: () => void;
  onReset: () => void;
}) {
  const round = getCurrentRound(game);
  const activePlayer = findPlayer(game, round.activePlayerId);

  return (
    <section className="grid gap-5 rounded-lg bg-white p-5 shadow-soft sm:p-7">
      <div className="grid gap-2">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-coral">
          Resultado de ronda
        </p>
        <h2 className="text-3xl font-black text-ink">
          Número secreto: {round.secretNumber}
        </h2>
        <p className="text-slate-600">
          {activePlayer.name} gana {round.activeScore} puntos por la pista.
        </p>
      </div>

      <ResultTable game={game} />
      <Scoreboard game={game} />

      <div className="flex flex-col gap-3 sm:flex-row">
        <button className="btn-primary" onClick={onNext}>
          {game.currentRoundIndex + 1 >= game.totalRounds
            ? "Ver resultado final"
            : "Siguiente ronda"}
        </button>
        <button className="btn-ghost" onClick={onReset}>
          Nueva partida
        </button>
      </div>
    </section>
  );
}

function TieBreakerCluesScreen({
  game,
  tieBreaker,
  onContinue,
}: {
  game: GameState;
  tieBreaker: TieBreaker;
  onContinue: (tieBreaker: TieBreaker) => void;
}) {
  const [clues, setClues] = useState<Record<string, string>>(tieBreaker.clues);
  const [error, setError] = useState("");

  const tiedPlayers = tieBreaker.tiedPlayerIds.map((id) => findPlayer(game, id));

  return (
    <section className="grid gap-5 rounded-lg bg-white p-5 shadow-soft sm:p-7">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-coral">
          Desempate
        </p>
        <h2 className="text-3xl font-black text-ink">Número común: {tieBreaker.secretNumber}</h2>
        <p className="text-slate-600">
          Cada finalista escribe una pista para el mismo número. Luego se vota la
          pista que mejor lo representa.
        </p>
      </div>

      <div className="grid gap-3">
        {tiedPlayers.map((player) => (
          <Field key={player.id} label={`Pista de ${player.name}`}>
            <textarea
              className="input min-h-24 resize-y"
              value={clues[player.id] ?? ""}
              onChange={(event) => setClues({ ...clues, [player.id]: event.target.value })}
            />
          </Field>
        ))}
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button
        className="btn-primary"
        onClick={() => {
          if (tiedPlayers.some((player) => !clues[player.id]?.trim())) {
            setError("Todos los jugadores empatados deben escribir una pista.");
            return;
          }
          onContinue({ ...tieBreaker, clues });
        }}
      >
        Pasar a votación
      </button>
    </section>
  );
}

function TieBreakerVoteScreen({
  game,
  tieBreaker,
  onFinish,
}: {
  game: GameState;
  tieBreaker: TieBreaker;
  onFinish: (tieBreaker: TieBreaker) => void;
}) {
  const externalVoters = game.players.filter(
    (player) => !tieBreaker.tiedPlayerIds.includes(player.id),
  );
  const voters = externalVoters.length > 0 ? externalVoters : game.players;
  const [votes, setVotes] = useState<Record<string, string>>(tieBreaker.votes);
  const [error, setError] = useState("");

  return (
    <section className="grid gap-5 rounded-lg bg-white p-5 shadow-soft sm:p-7">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky">
          Votación final
        </p>
        <h2 className="text-3xl font-black text-ink">Número secreto: {tieBreaker.secretNumber}</h2>
      </div>

      <div className="grid gap-3">
        {tieBreaker.tiedPlayerIds.map((playerId) => (
          <article key={playerId} className="rounded-lg border border-slate-200 p-4">
            <p className="font-bold text-ink">{findPlayer(game, playerId).name}</p>
            <p className="mt-2 text-slate-700">{tieBreaker.clues[playerId]}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {voters.map((voter) => (
          <Field key={voter.id} label={`Voto de ${voter.name}`}>
            <select
              className="input"
              value={votes[voter.id] ?? ""}
              onChange={(event) => setVotes({ ...votes, [voter.id]: event.target.value })}
            >
              <option value="">Elige una pista</option>
              {tieBreaker.tiedPlayerIds
                .filter((candidateId) => candidateId !== voter.id)
                .map((candidateId) => (
                  <option key={candidateId} value={candidateId}>
                    {findPlayer(game, candidateId).name}
                  </option>
                ))}
            </select>
          </Field>
        ))}
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button
        className="btn-primary"
        onClick={() => {
          if (voters.some((voter) => !votes[voter.id])) {
            setError("Todos los votantes deben elegir una pista.");
            return;
          }
          onFinish({ ...tieBreaker, votes });
        }}
      >
        Declarar ganador
      </button>
    </section>
  );
}

function FinalScreen({
  game,
  onReset,
  tieBreaker,
}: {
  game: GameState;
  onReset: () => void;
  tieBreaker?: TieBreaker;
}) {
  const sortedScores = getSortedScores(game);
  const winnerId = tieBreaker?.winnerId ?? getWinnerIdsByScore(game)[0];
  const winner = findPlayer(game, winnerId);

  return (
    <section className="grid gap-5 rounded-lg bg-white p-5 shadow-soft sm:p-7">
      <div className="rounded-lg bg-lemon/25 p-5">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-ink">
          Ganador
        </p>
        <h2 className="text-4xl font-black text-ink">{winner.name}</h2>
        {tieBreaker?.winnerId && (
          <p className="mt-2 text-slate-700">Victoria decidida por desempate final.</p>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="p-3">Posición</th>
              <th className="p-3">Jugador</th>
              <th className="p-3">Puntos</th>
              <th className="p-3">Aciertos</th>
            </tr>
          </thead>
          <tbody>
            {sortedScores.map((score, index) => (
              <tr key={score.playerId} className="border-t border-slate-200">
                <td className="p-3 font-bold">{index + 1}</td>
                <td className="p-3">{findPlayer(game, score.playerId).name}</td>
                <td className="p-3">{score.points}</td>
                <td className="p-3">{score.exactHits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="btn-primary" onClick={onReset}>
        Nueva partida
      </button>
    </section>
  );
}

function RoundHeader({
  game,
  activePlayer,
}: {
  game: GameState;
  activePlayer: Player;
}) {
  return (
    <div className="grid gap-1">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-sky">
        Ronda {game.currentRoundIndex + 1} de {game.totalRounds}
      </p>
      <h2 className="text-3xl font-black text-ink">Turno de {activePlayer.name}</h2>
    </div>
  );
}

function ResultTable({ game }: { game: GameState }) {
  const round = getCurrentRound(game);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="p-3">Jugador</th>
            <th className="p-3">Respuesta</th>
            <th className="p-3">Diferencia</th>
            <th className="p-3">Puntos</th>
          </tr>
        </thead>
        <tbody>
          {round.guessResults.map((result) => (
            <tr key={result.playerId} className="border-t border-slate-200">
              <td className="p-3 font-semibold">{findPlayer(game, result.playerId).name}</td>
              <td className="p-3">{result.value}</td>
              <td className="p-3">{result.difference}</td>
              <td className="p-3">{result.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Scoreboard({ game }: { game: GameState }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="mb-3 font-bold text-ink">Marcador acumulado</h3>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {getSortedScores(game).map((score) => (
          <div key={score.playerId} className="rounded-lg bg-white p-3">
            <p className="font-bold text-ink">{findPlayer(game, score.playerId).name}</p>
            <p className="text-sm text-slate-600">
              {score.points} pts · {score.exactHits} aciertos
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScaleBar() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between text-sm font-bold">
        <span className="text-coral">1 = muy malo</span>
        <span className="text-mint">10 = muy bueno</span>
      </div>
      <div className="grid grid-cols-10 overflow-hidden rounded-md border border-slate-200">
        {Array.from({ length: 10 }, (_, index) => (
          <div
            key={index}
            className="border-r border-white py-2 text-center text-sm font-black last:border-r-0"
            style={{
              background: `linear-gradient(90deg, rgba(255,107,107,${
                0.85 - index * 0.04
              }), rgba(47,191,143,${0.18 + index * 0.07}))`,
            }}
          >
            {index + 1}
          </div>
        ))}
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-bold text-ink">
      {label}
      {children}
    </label>
  );
}

function findPlayer(game: GameState, playerId: string) {
  const player = game.players.find((item) => item.id === playerId);
  if (!player) throw new Error(`Player not found: ${playerId}`);
  return player;
}

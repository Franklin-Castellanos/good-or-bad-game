import {
  calculateGuessResults,
  getRandomSecretNumber,
  scoreActivePlayer,
} from "./scoring";
import type { GameState, Guess, Player, Round, Score, TieBreaker } from "./types";

export function createPlayer(name: string, index: number): Player {
  return {
    id: `player-${index + 1}-${crypto.randomUUID()}`,
    name: name.trim(),
  };
}

export function createTurnOrder(players: Player[], totalRounds: number) {
  return Array.from({ length: totalRounds }, (_, index) => {
    return players[index % players.length].id;
  });
}

export function createInitialScores(players: Player[]): Record<string, Score> {
  return Object.fromEntries(
    players.map((player) => [
      player.id,
      {
        playerId: player.id,
        points: 0,
        exactHits: 0,
        activePoints: 0,
      },
    ]),
  );
}

export function createRound(roundNumber: number, activePlayerId: string): Round {
  return {
    id: `round-${roundNumber}-${crypto.randomUUID()}`,
    roundNumber,
    activePlayerId,
    secretNumber: getRandomSecretNumber(),
    clue: "",
    guesses: [],
    guessResults: [],
    activeScore: 0,
    completed: false,
  };
}

export function createGame(players: Player[], totalRounds: number): GameState {
  const turnOrder = createTurnOrder(players, totalRounds);

  return {
    phase: "clue",
    players,
    totalRounds,
    turnOrder,
    currentRoundIndex: 0,
    rounds: [createRound(1, turnOrder[0])],
    scores: createInitialScores(players),
  };
}

export function getCurrentRound(game: GameState) {
  return game.rounds[game.currentRoundIndex];
}

export function completeRound(game: GameState, guesses: Guess[]): GameState {
  const currentRound = getCurrentRound(game);
  const guessResults = calculateGuessResults(currentRound.secretNumber, guesses);
  const activeScore = scoreActivePlayer(currentRound.secretNumber, guesses);
  const scores = { ...game.scores };

  for (const result of guessResults) {
    const currentScore = scores[result.playerId];
    scores[result.playerId] = {
      ...currentScore,
      points: currentScore.points + result.points,
      exactHits: currentScore.exactHits + (result.difference === 0 ? 1 : 0),
    };
  }

  const activePlayerScore = scores[currentRound.activePlayerId];
  scores[currentRound.activePlayerId] = {
    ...activePlayerScore,
    points: activePlayerScore.points + activeScore,
    activePoints: activePlayerScore.activePoints + activeScore,
  };

  const completedRound: Round = {
    ...currentRound,
    guesses,
    guessResults,
    activeScore,
    completed: true,
  };

  const rounds = [...game.rounds];
  rounds[game.currentRoundIndex] = completedRound;

  return {
    ...game,
    phase: "result",
    rounds,
    scores,
  };
}

export function advanceRound(game: GameState): GameState {
  const nextRoundIndex = game.currentRoundIndex + 1;

  if (nextRoundIndex >= game.totalRounds) {
    return prepareFinalPhase(game);
  }

  const nextRound = createRound(
    nextRoundIndex + 1,
    game.turnOrder[nextRoundIndex],
  );

  return {
    ...game,
    phase: "clue",
    currentRoundIndex: nextRoundIndex,
    rounds: [...game.rounds, nextRound],
  };
}

export function getSortedScores(game: GameState) {
  return Object.values(game.scores).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.exactHits - a.exactHits;
  });
}

export function getWinnerIdsByScore(game: GameState) {
  const sorted = getSortedScores(game);
  const top = sorted[0];

  return sorted
    .filter((score) => score.points === top.points && score.exactHits === top.exactHits)
    .map((score) => score.playerId);
}

export function prepareFinalPhase(game: GameState): GameState {
  const tiedPlayerIds = getWinnerIdsByScore(game);

  if (tiedPlayerIds.length <= 1) {
    return {
      ...game,
      phase: "final",
    };
  }

  return {
    ...game,
    phase: "tiebreaker-clues",
    tieBreaker: createTieBreaker(tiedPlayerIds),
  };
}

export function createTieBreaker(tiedPlayerIds: string[]): TieBreaker {
  return {
    secretNumber: getRandomSecretNumber(),
    tiedPlayerIds,
    clues: {},
    votes: {},
  };
}

export function resolveTieBreaker(tieBreaker: TieBreaker): TieBreaker {
  const voteCounts = tieBreaker.tiedPlayerIds.map((playerId) => ({
    playerId,
    votes: Object.values(tieBreaker.votes).filter((vote) => vote === playerId).length,
  }));
  const maxVotes = Math.max(...voteCounts.map((item) => item.votes));
  const leaders = voteCounts.filter((item) => item.votes === maxVotes);
  const winnerId =
    leaders.length === 1
      ? leaders[0].playerId
      : leaders[Math.floor(Math.random() * leaders.length)].playerId;

  return {
    ...tieBreaker,
    winnerId,
  };
}

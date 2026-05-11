export type GamePhase =
  | "home"
  | "setup"
  | "clue"
  | "guess"
  | "result"
  | "final"
  | "tiebreaker-clues"
  | "tiebreaker-vote"
  | "tiebreaker-result";

export type Player = {
  id: string;
  name: string;
};

export type Guess = {
  playerId: string;
  value: number;
};

export type GuessResult = Guess & {
  difference: number;
  points: number;
};

export type Score = {
  playerId: string;
  points: number;
  exactHits: number;
  activePoints: number;
};

export type Round = {
  id: string;
  roundNumber: number;
  activePlayerId: string;
  secretNumber: number;
  clue: string;
  guesses: Guess[];
  guessResults: GuessResult[];
  activeScore: number;
  completed: boolean;
};

export type TieBreaker = {
  secretNumber: number;
  tiedPlayerIds: string[];
  clues: Record<string, string>;
  votes: Record<string, string>;
  winnerId?: string;
};

export type GameState = {
  phase: GamePhase;
  players: Player[];
  totalRounds: number;
  turnOrder: string[];
  currentRoundIndex: number;
  rounds: Round[];
  scores: Record<string, Score>;
  tieBreaker?: TieBreaker;
};

import type { Guess, GuessResult } from "./types";

export function getRandomSecretNumber() {
  return Math.floor(Math.random() * 10) + 1;
}

export function scoreGuess(secretNumber: number, guess: number) {
  const difference = Math.abs(secretNumber - guess);

  if (difference === 0) return 5;
  if (difference === 1) return 3;
  if (difference === 2) return 2;
  if (difference === 3) return 1;
  return 0;
}

export function scoreActivePlayer(secretNumber: number, guesses: Guess[]) {
  if (guesses.length === 0) return 0;

  const bestDifference = Math.min(
    ...guesses.map((guess) => Math.abs(secretNumber - guess.value)),
  );

  if (bestDifference === 0) return 3;
  if (bestDifference === 1) return 2;
  if (bestDifference === 2) return 1;
  return 0;
}

export function calculateGuessResults(
  secretNumber: number,
  guesses: Guess[],
): GuessResult[] {
  return guesses.map((guess) => {
    const difference = Math.abs(secretNumber - guess.value);

    return {
      ...guess,
      difference,
      points: scoreGuess(secretNumber, guess.value),
    };
  });
}

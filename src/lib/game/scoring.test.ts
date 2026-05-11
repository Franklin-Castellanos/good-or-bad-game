import { describe, expect, it } from "vitest";
import {
  calculateGuessResults,
  scoreActivePlayer,
  scoreGuess,
} from "./scoring";

describe("scoreGuess", () => {
  it("scores guesses by distance from the secret number", () => {
    expect(scoreGuess(7, 7)).toBe(5);
    expect(scoreGuess(7, 8)).toBe(3);
    expect(scoreGuess(7, 5)).toBe(2);
    expect(scoreGuess(7, 4)).toBe(1);
    expect(scoreGuess(7, 3)).toBe(0);
  });
});

describe("scoreActivePlayer", () => {
  it("gives 3 points when at least one player guesses exactly", () => {
    expect(scoreActivePlayer(7, [{ playerId: "a", value: 7 }])).toBe(3);
  });

  it("gives 2 points when the best guess is one away", () => {
    expect(scoreActivePlayer(7, [{ playerId: "a", value: 8 }])).toBe(2);
  });

  it("gives 1 point when the best guess is two away", () => {
    expect(scoreActivePlayer(7, [{ playerId: "a", value: 5 }])).toBe(1);
  });

  it("gives 0 points when all guesses are three or more away", () => {
    expect(scoreActivePlayer(7, [{ playerId: "a", value: 4 }])).toBe(0);
  });
});

describe("calculateGuessResults", () => {
  it("returns difference and points for each guess", () => {
    expect(
      calculateGuessResults(7, [
        { playerId: "laura", value: 7 },
        { playerId: "andres", value: 8 },
        { playerId: "camila", value: 6 },
        { playerId: "mateo", value: 4 },
      ]),
    ).toEqual([
      { playerId: "laura", value: 7, difference: 0, points: 5 },
      { playerId: "andres", value: 8, difference: 1, points: 3 },
      { playerId: "camila", value: 6, difference: 1, points: 3 },
      { playerId: "mateo", value: 4, difference: 3, points: 1 },
    ]);
  });
});

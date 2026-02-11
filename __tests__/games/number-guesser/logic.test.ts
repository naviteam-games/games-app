import {
  initializeState,
  validateAction,
  applyAction,
  isPhaseComplete,
  resolvePhase,
  isGameOver,
  calculateResults,
  getPlayerView,
  getDefaultConfig,
  getNextPhase,
} from "@/games/number-guesser/logic";

const defaultConfig = getDefaultConfig();
const playerIds = ["player1", "player2", "player3"];

describe("Number Guesser Logic", () => {
  describe("initializeState", () => {
    it("creates a valid initial state", () => {
      const state = initializeState(defaultConfig, playerIds) as Record<string, unknown>;
      expect(state).toHaveProperty("currentRound", 1);
      expect(state).toHaveProperty("totalRounds", 3);
      expect(state).toHaveProperty("targetNumber");
      expect(state).toHaveProperty("playerIds");
      expect((state as any).playerIds).toEqual(playerIds);
      expect(Object.keys((state as any).guesses)).toHaveLength(3);
      expect(Object.values((state as any).guesses)).toEqual([null, null, null]);
    });

    it("uses config values for rounds", () => {
      const config = { ...defaultConfig, rounds: 5 };
      const state = initializeState(config, playerIds) as any;
      expect(state.totalRounds).toBe(5);
    });
  });

  describe("validateAction", () => {
    let state: Record<string, unknown>;

    beforeEach(() => {
      state = initializeState(defaultConfig, playerIds);
    });

    it("accepts a valid guess", () => {
      const result = validateAction(state, {
        type: "guess",
        playerId: "player1",
        data: { guess: 50 },
      });
      expect(result.valid).toBe(true);
    });

    it("rejects invalid action type", () => {
      const result = validateAction(state, {
        type: "invalid",
        playerId: "player1",
        data: { guess: 50 },
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid action type");
    });

    it("rejects out of range guess", () => {
      const result = validateAction(state, {
        type: "guess",
        playerId: "player1",
        data: { guess: 999 },
      });
      expect(result.valid).toBe(false);
    });

    it("rejects double guess", () => {
      state = applyAction(state, {
        type: "guess",
        playerId: "player1",
        data: { guess: 50 },
      });
      const result = validateAction(state, {
        type: "guess",
        playerId: "player1",
        data: { guess: 60 },
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain("already guessed");
    });

    it("rejects unknown player", () => {
      const result = validateAction(state, {
        type: "guess",
        playerId: "unknown",
        data: { guess: 50 },
      });
      expect(result.valid).toBe(false);
    });
  });

  describe("applyAction", () => {
    it("records a player guess", () => {
      let state = initializeState(defaultConfig, playerIds);
      state = applyAction(state, {
        type: "guess",
        playerId: "player1",
        data: { guess: 42 },
      });
      expect((state as any).guesses.player1).toBe(42);
      expect((state as any).guesses.player2).toBeNull();
    });
  });

  describe("isPhaseComplete", () => {
    it("returns false when not all players guessed", () => {
      let state = initializeState(defaultConfig, playerIds);
      state = applyAction(state, { type: "guess", playerId: "player1", data: { guess: 50 } });
      expect(isPhaseComplete(state, "playing")).toBe(false);
    });

    it("returns true when all players guessed", () => {
      let state = initializeState(defaultConfig, playerIds);
      state = applyAction(state, { type: "guess", playerId: "player1", data: { guess: 50 } });
      state = applyAction(state, { type: "guess", playerId: "player2", data: { guess: 30 } });
      state = applyAction(state, { type: "guess", playerId: "player3", data: { guess: 70 } });
      expect(isPhaseComplete(state, "playing")).toBe(true);
    });
  });

  describe("resolvePhase", () => {
    it("resolves round and picks correct winner", () => {
      let state = initializeState({ ...defaultConfig, rounds: 1 }, playerIds);
      const target = (state as any).targetNumber;

      state = applyAction(state, { type: "guess", playerId: "player1", data: { guess: target } });
      state = applyAction(state, { type: "guess", playerId: "player2", data: { guess: target + 50 > 100 ? target - 50 : target + 50 } });
      state = applyAction(state, { type: "guess", playerId: "player3", data: { guess: target + 25 > 100 ? target - 25 : target + 25 } });

      state = resolvePhase(state, "playing");
      const results = (state as any).roundResults;

      expect(results).toHaveLength(1);
      expect(results[0].winnerId).toBe("player1");
      expect(results[0].winnerDistance).toBe(0);
      expect((state as any).playerScores.player1).toBe(1);
    });

    it("advances to next round", () => {
      let state = initializeState(defaultConfig, playerIds);
      state = applyAction(state, { type: "guess", playerId: "player1", data: { guess: 50 } });
      state = applyAction(state, { type: "guess", playerId: "player2", data: { guess: 30 } });
      state = applyAction(state, { type: "guess", playerId: "player3", data: { guess: 70 } });
      state = resolvePhase(state, "playing");

      expect((state as any).currentRound).toBe(2);
      expect(Object.values((state as any).guesses)).toEqual([null, null, null]);
    });
  });

  describe("isGameOver", () => {
    it("is not over after first round of multi-round game", () => {
      let state = initializeState(defaultConfig, playerIds);
      state = applyAction(state, { type: "guess", playerId: "player1", data: { guess: 50 } });
      state = applyAction(state, { type: "guess", playerId: "player2", data: { guess: 30 } });
      state = applyAction(state, { type: "guess", playerId: "player3", data: { guess: 70 } });
      state = resolvePhase(state, "playing");

      expect(isGameOver(state)).toBe(false);
    });

    it("is over after all rounds", () => {
      let state = initializeState({ ...defaultConfig, rounds: 1 }, playerIds);
      state = applyAction(state, { type: "guess", playerId: "player1", data: { guess: 50 } });
      state = applyAction(state, { type: "guess", playerId: "player2", data: { guess: 30 } });
      state = applyAction(state, { type: "guess", playerId: "player3", data: { guess: 70 } });
      state = resolvePhase(state, "playing");

      expect(isGameOver(state)).toBe(true);
    });
  });

  describe("calculateResults", () => {
    it("returns sorted rankings", () => {
      let state = initializeState({ ...defaultConfig, rounds: 1 }, playerIds);
      const target = (state as any).targetNumber;
      state = applyAction(state, { type: "guess", playerId: "player1", data: { guess: target } });
      state = applyAction(state, { type: "guess", playerId: "player2", data: { guess: target + 10 > 100 ? 1 : target + 10 } });
      state = applyAction(state, { type: "guess", playerId: "player3", data: { guess: target + 20 > 100 ? 1 : target + 20 } });
      state = resolvePhase(state, "playing");

      const results = calculateResults(state);
      expect(results.rankings[0].playerId).toBe("player1");
      expect(results.rankings[0].score).toBe(1);
      expect(results.rankings[0].rank).toBe(1);
    });
  });

  describe("getPlayerView", () => {
    it("hides target number during playing phase", () => {
      const state = initializeState(defaultConfig, playerIds);
      const view = getPlayerView(state, "player1", "playing");

      expect(view.phase).toBe("playing");
      expect(view.publicState).not.toHaveProperty("targetNumber");
      expect(view.publicState.hasGuessed).toBeDefined();
    });

    it("shows round result in round_end phase", () => {
      let state = initializeState(defaultConfig, playerIds);
      state = applyAction(state, { type: "guess", playerId: "player1", data: { guess: 50 } });
      state = applyAction(state, { type: "guess", playerId: "player2", data: { guess: 30 } });
      state = applyAction(state, { type: "guess", playerId: "player3", data: { guess: 70 } });
      state = resolvePhase(state, "playing");

      const view = getPlayerView(state, "player1", "round_end");
      expect(view.publicState.lastRoundResult).toBeDefined();
    });
  });

  describe("getNextPhase", () => {
    it("transitions playing -> round_end when not game over", () => {
      let state = initializeState(defaultConfig, playerIds);
      state = applyAction(state, { type: "guess", playerId: "player1", data: { guess: 50 } });
      state = applyAction(state, { type: "guess", playerId: "player2", data: { guess: 30 } });
      state = applyAction(state, { type: "guess", playerId: "player3", data: { guess: 70 } });
      state = resolvePhase(state, "playing");

      expect(getNextPhase("playing", state)).toBe("round_end");
    });

    it("transitions playing -> finished when game over", () => {
      let state = initializeState({ ...defaultConfig, rounds: 1 }, playerIds);
      state = applyAction(state, { type: "guess", playerId: "player1", data: { guess: 50 } });
      state = applyAction(state, { type: "guess", playerId: "player2", data: { guess: 30 } });
      state = applyAction(state, { type: "guess", playerId: "player3", data: { guess: 70 } });
      state = resolvePhase(state, "playing");

      expect(getNextPhase("playing", state)).toBe("finished");
    });

    it("transitions round_end -> playing", () => {
      expect(getNextPhase("round_end", {})).toBe("playing");
    });
  });
});

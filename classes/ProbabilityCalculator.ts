import Dice from "./Dice";

export default class ProbabilityCalculator {
    static calculateWinProbability(diceA: Dice, diceB: Dice): number {
        let wins = 0;
        let total = 0;
        for (const a of diceA.values) {
            for (const b of diceB.values) {
                if (a > b) wins++;
                total++;
            }
        }
        return wins / total;
    }
}
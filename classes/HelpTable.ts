import Dice from "./Dice";
import {AsciiTable3} from 'ascii-table3';
import ProbabilityCalculator from "./ProbabilityCalculator";

export default class HelpTable {
    static print(diceArray: Dice[]): void {
        const table = new AsciiTable3('Probability of the win for the user:');
        const header = ['Dice', ...diceArray.map(d => d.values.join(','))];
        table.setHeading(...header);

 
        for (let i = 0; i < diceArray.length; i++) {
            const row = [diceArray[i].values.join(',')];
            for (let j = 0; j < diceArray.length; j++) {
                if (i === j) {
                    row.push('—');
                } else {
                    const prob = ProbabilityCalculator.calculateWinProbability(diceArray[i], diceArray[j]);
                    row.push(prob.toFixed(4));
                }
            }
            table.addRow(...row);
        }

        console.log(table.toString());
    }
}
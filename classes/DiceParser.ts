import Dice from './Dice';

export default class DiceParser {
    static parse(args: string[]): Dice[] {
        if (args.length < 3)
            throw new Error('Error: At least 3 dice are required. Example: 2,2,4,4,9,9 6,8,1,1,8,6 7,5,3,7,5,3');

        const diceArray: Dice[] = [];
        for (const arg of args) {
            const numbers = arg.split(' ').map(n => {
                const num = parseInt(n.trim(), 10);
                if (isNaN(num)) throw new Error(`Error: Non-integer value found in dice: ${arg}`);
                return num;
            });
            diceArray.push(new Dice(numbers));
        }
        return diceArray;
    }
}
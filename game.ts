import * as crypto from 'crypto';
import * as readline from 'readline';
import {AsciiTable3} from 'ascii-table3';
import random from 'random';

class Dice {
    constructor(public values: number[]) {
        if (!Array.isArray(values) || values.length<=2)
            throw new Error('Dice must have at least three sides');
    }

    roll(index: number): number {
        return this.values[index];
    }   

    size(): number {
        return this.values.length;
    }

    toString(): string {
        return `[${this.values.join(',')}]`;
    }
    
}

class DiceParser {
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

class CryptoHelper {
    static generateKey(): Buffer {
        return crypto.randomBytes(32);
    }

    static generateNumber(range: number): number {
        return crypto.randomInt(0,range);
    }

    static calculateHMAC(key: Buffer, msg: number): string {
        return crypto.createHmac('sha3-256', key).update(msg.toString()).digest('hex');
    }
}

class FairRandomGenerator {
    private key: Buffer;
    private computerNumber: number;
    private range: number;

    constructor(range: number) {
        this.range = range;
        this.key = CryptoHelper.generateKey();
        this.computerNumber = CryptoHelper.generateNumber(range);
    }

    getHMAC(): string {
        return CryptoHelper.calculateHMAC(this.key, this.computerNumber);
    }

    revealKey(): string {
        return this.key.toString('hex');
    }

    computeResult(userNumber: number): number {
        return (this.computerNumber + userNumber) % this.range;
    }

    getComputerNumber(): number {
        return this.computerNumber;
    }
}

class ProbabilityCalculator {
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

class HelpTable {
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

class Game {
    private diceArray: Dice[];
    private rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    constructor(diceArray: Dice[]) {
        this.diceArray = diceArray;
    }

    async run(): Promise<void> {
        console.log("Let's determine who makes the first move.");
        const fairGen = new FairRandomGenerator(2);
        console.log(`I selected a random value in the range 0..1 (HMAC=${fairGen.getHMAC()})`);
        let valid:Boolean=false;
        let userGuess;

        do 
        {
            userGuess = await this.prompt('Try to guess my selection.\n0 - 0\n1 - 1\nX - exit\n? - help\nYour selection:');
            if (userGuess.toLowerCase() === 'x') return this.exit()
            else if (userGuess === '?') HelpTable.print(this.diceArray)
            else if (userGuess==="0" || userGuess==="1") valid=true
            else console.log('Invalid selection. Try again.')
        } while (valid===false);

        const userNumber = parseInt(userGuess, 10);
        const computerNumber = fairGen.getComputerNumber();
        const result = fairGen.computeResult(userNumber);
        console.log(`My selection: ${computerNumber} (KEY=${fairGen.revealKey()})`);

        let userDice;
        let computerDice

        const computerFirst = result === 1;
        if (computerFirst) {
            let userDiceIndex=NaN;
            const computerDiceIndex = this.autoSelectDice(userDiceIndex);
            computerDice = this.diceArray[computerDiceIndex];
            console.log(`I make the first move and choose the dice ${computerDice.toString()}`);
            userDiceIndex = await this.selectDice('Choose your dice:',computerDiceIndex)
            userDice = this.diceArray[userDiceIndex];
        } else {
            console.log('You make the first move and choose the dice.');
            const userDiceIndex = await this.selectDice('Choose your dice:',NaN)
            const computerDiceIndex = this.autoSelectDice(userDiceIndex);
            computerDice = this.diceArray[computerDiceIndex];
            userDice = this.diceArray[userDiceIndex];
        }
        

        console.log(`You chose: ${userDice.toString()}`);
        console.log(`I chose: ${computerDice.toString()}`);

        let compRoll;
        let userRoll;

        if (computerFirst) {
            compRoll = await this.fairRoll(computerDice, 'computer');
            userRoll = await this.fairRoll(userDice, 'user');
        } else {
            userRoll = await this.fairRoll(userDice, 'user');
            compRoll = await this.fairRoll(computerDice, 'computer');
        }


        if (userRoll > compRoll) console.log(`You win (${userRoll}>${compRoll})!`);
        else if (compRoll > userRoll) console.log(`I win (${userRoll}<${compRoll})!`);
        else console.log(`It's a tie (${userRoll}=${compRoll})!`);

        this.exit();
    }

    private async fairRoll(dice: Dice, label: string): Promise<number> {
        const fairGen = new FairRandomGenerator(dice.size());
        console.log(`It's time for ${label === 'user' ? 'your' : 'my'} roll.`);
        console.log(`I selected a random value in the range 0..${dice.size() - 1} (HMAC=${fairGen.getHMAC()})`);
        let userNum;
        do {
            console.log(`Add your number modulo ${dice.size()}`)
            for(let i=0;i<dice.size();i++){
                console.log(`${i} - ${i}`)
            }
            console.log("X - exit\n? - help")
            const Num = await this.prompt("Your selection:");
            userNum=parseInt(Num,10);
            if (Num.toLowerCase() === 'x') this.exit() 
            else if (Num === '?') HelpTable.print(this.diceArray)
            else if (!isNaN(userNum) && userNum >= 0 && userNum < dice.size()) break;
            else console.log('Invalid selection. Try again.');
        } while(!dice[userNum]); 
        const resultIndex = fairGen.computeResult(userNum);
        console.log(`My number is ${fairGen.getComputerNumber()} (KEY=${fairGen.revealKey()})`);
        console.log(`The fair number generation result is ${userNum}+${fairGen.getComputerNumber()}=${resultIndex} (mod ${dice.size()})`);
        console.log(`${label === 'user' ? 'Your' : 'My'} roll result is ${dice.roll(resultIndex)}.`);
        return dice.roll(resultIndex);
    }

    private async selectDice(promptText: string,excludeIndex: number): Promise<number> {
        while (true) {
            console.log(promptText);
            const newDices:Dice[]=this.diceArray.filter((_,index) => index !== excludeIndex)
            newDices.forEach((dice, index) => console.log(`${index} - ${dice.toString()}`));
            console.log('X - exit\n? - help');

            const input = await this.prompt('Your selection: ');
            const idx = parseInt(input, 10);
            if (input.toLowerCase() === 'x') this.exit() 
            else if (input === '?') HelpTable.print(this.diceArray)
            else if (!isNaN(idx) && idx >= 0 && idx < this.diceArray.length) return idx
            else console.log('Invalid selection. Try again.');
        }
    }

    private autoSelectDice(excludeIndex: number): number {
        let index: number;
        do {
            index = CryptoHelper.generateNumber(this.diceArray.length);
        } while (index === excludeIndex);
        return index;
    }

    private prompt(question: string): Promise<string> {
        return new Promise(resolve => this.rl.question(question, resolve));
    }

    private exit(): void {
        this.rl.close();
        process.exit(0);
    }
}

try {
    const args:string[] = process.argv.slice(2);
    const diceArray = DiceParser.parse(args);
    const game = new Game(diceArray);
    game.run();
} catch (error) {
    console.error((error as Error).message);
    console.log('Example: npx tsx game.ts 2,2,4,4,9,9 6,8,1,1,8,6 7,5,3,7,5,3');
    process.exit(1);
}

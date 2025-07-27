import * as readline from 'readline';
import Dice from './Dice';
import CryptoHelper from './CryptoHelper';
import FairRandomGenerator from './FairRandomGenerator';
import HelpTable from "./HelpTable"

export default class Game {
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
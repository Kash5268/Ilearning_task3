import DiceParser from './classes/DiceParser';
import Game from './classes/Game';

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

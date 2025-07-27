export default class Dice {
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
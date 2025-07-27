import CryptoHelper from "./CryptoHelper";

export default class FairRandomGenerator {
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
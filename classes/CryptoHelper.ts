import * as crypto from 'crypto';

export default class CryptoHelper {
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
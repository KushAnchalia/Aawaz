import {
    Connection,
    PublicKey,
    Transaction,
    SystemProgram,
    LAMPORTS_PER_SOL
} from '@solana/web3.js';
import { getConnection } from "../lib/solana";

/**
 * TransactionBuilder: Handles Solana transaction logistics.
 */
export class TransactionBuilder {
    private connection: Connection;

    constructor() {
        this.connection = getConnection();
    }

    async buildTransfer(fromPubkey: PublicKey, toPubkey: string, amount: number): Promise<Transaction> {
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey,
                toPubkey: new PublicKey(toPubkey),
                lamports: amount * LAMPORTS_PER_SOL,
            })
        );

        const latestBlockhash = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = latestBlockhash.blockhash;
        transaction.feePayer = fromPubkey;

        return transaction;
    }
}

export const transactionBuilder = new TransactionBuilder();

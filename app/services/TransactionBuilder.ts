import {
    Connection,
    PublicKey,
    Transaction,
    SystemProgram,
    LAMPORTS_PER_SOL
} from '@solana/web3.js';

/**
 * TransactionBuilder: Handles Solana transaction logistics.
 */
export class TransactionBuilder {
    private connection: Connection;

    constructor() {
        this.connection = new Connection("https://api.devnet.solana.com", "confirmed");
    }

    async buildTransfer(fromPubkey: PublicKey, toPubkey: string, amount: number): Promise<Transaction> {
        const transaction = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey,
                toPubkey: new PublicKey(toPubkey),
                lamports: amount * LAMPORTS_PER_SOL,
            })
        );

        const { blockhash } = await this.connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = fromPubkey;

        return transaction;
    }
}

export const transactionBuilder = new TransactionBuilder();

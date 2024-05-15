import { Connection, Keypair, VersionedTransaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import fetch from "cross-fetch";
import { Wallet } from "@project-serum/anchor";
import bs58 from "bs58";

// Initialize the connection and wallet
const connection = new Connection("RPC");
const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY || "KEY")));

// Assume your quoteResponse is fetched correctly here
const quoteResponse = await (
    await fetch(
      "https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112\
  &outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v\
  &amount=1000000\
  &slippageBps=5000"
    )
  ).json();
// Fetch the serialized transaction from the swap API
const { swapTransaction } = await (await fetch("https://quote-api.jup.ag/v6/swap", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    quoteResponse,
    userPublicKey: wallet.publicKey.toString(),
    wrapAndUnwrapSol: true,
    dynamicComputeUnitLimit: true,
    prioritizationFeeLamports: {
      autoMultiplier: 15,
    },
  }),
})).json();

// Deserialize the transaction
const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
var transaction = VersionedTransaction.deserialize(swapTransactionBuf);

// Fetch a new recent blockhash
const { blockhash } = await connection.getRecentBlockhash();

// Assign the new blockhash to the transaction (you have to recreate the transaction with the new blockhash)
transaction.recentBlockhash = blockhash;

// Sign the transaction with the wallet's payer
transaction.sign([wallet.payer]);

// Serialize the transaction
const rawTransaction = transaction.serialize();

// Send and confirm the transaction
const txid = await connection.sendRawTransaction(rawTransaction, {
  skipPreflight: false,
  maxRetries: 2,
});
await connection.confirmTransaction(txid);

console.log(`Transaction successful: https://solscan.io/tx/${txid}`);

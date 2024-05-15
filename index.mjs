import { Connection, Keypair, VersionedTransaction } from "@solana/web3.js";
import fetch from "cross-fetch";
import { Wallet } from "@project-serum/anchor";
import bs58 from "bs58";

// It is recommended that you use your own RPC endpoint.
// This RPC endpoint is only for demonstration purposes so that this example will run.
const connection = new Connection(
  "RPC"
);
const wallet = new Wallet(
  Keypair.fromSecretKey(
    bs58.decode(
      process.env.PRIVATE_KEY ||
        "KEYS"
    )
  )
);
//const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(process.env.PRIVATE_KEY || '')));
// swapping SOL to USDC with input 0.1 SOL and 0.5% slippage
// Swapping SOL to USDC with input 0.1 SOL and 0.5% slippage
const quoteResponse = await (
  await fetch(
    "https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112\
&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v\
&amount=1000000\
&slippageBps=5000"
  )
).json();
// get serialized transactions for the swap
const { swapTransaction } = await (
  await fetch("https://quote-api.jup.ag/v6/swap", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      // quoteResponse from /quote api
      quoteResponse,
      // user public key to be used for the swap
      userPublicKey: wallet.publicKey.toString(),
      // auto wrap and unwrap SOL. default is true
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
      prioritizationFeeLamports: "auto",
      prioritizationFeeLamports: {
        autoMultiplier: 15,
      },
      // feeAccount is optional. Use if you want to charge a fee.  feeBps must have been passed in /quote API.
      // feeAccount: wallet.publicKey.toString()
    }),
  })
).json();
// deserialize the transaction
const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
var transaction = VersionedTransaction.deserialize(swapTransactionBuf);
console.log(transaction);

// sign the transaction
transaction.sign([wallet.payer]);
// Execute the transaction
const rawTransaction = transaction.serialize();
const txid = await connection.sendRawTransaction(rawTransaction, {
   skipPreflight: false,
  maxRetries: 2,
});
await connection.confirmTransaction(txid);
console.log(`https://solscan.io/tx/${txid}`);

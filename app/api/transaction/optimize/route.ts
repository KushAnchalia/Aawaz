import { NextRequest, NextResponse } from "next/server";
import { Connection, Transaction, PublicKey, SystemProgram } from "@solana/web3.js";
// @ts-ignore
import bs58 from "bs58";
import { getConnection } from "../../../lib/solana";

export interface OptimizationResult {
  parsed: {
    type: string;
    programs: string[];
    instructions: Array<{
      index: number;
      programId: string;
      accountsCount: number;
      dataSize: number;
    }>;
  };
  simulation: {
    success: boolean;
    computeUnits: number;
    logs: string[];
    error?: string;
  };
  network: {
    congestion: "LOW" | "MEDIUM" | "HIGH";
    recentFeeRate: number;
  };
  recommendations: {
    computeUnitLimit: number;
    priorityFee: number; // in lamports
    priorityFeeSOL: number;
  };
  timeRecommendation: {
    bestTime: string; // UTC
    congestionLevel: string;
  };
  costs: {
    baseFee: number; // in SOL
    currentCost: number; // in SOL
    optimizedCost: number; // in SOL
    savings: number; // in SOL
    savingsPercent: number;
  };
  successProbability: number; // 0-1
  optimizationScore: number; // 0-100
}

export async function POST(req: NextRequest) {
  try {
    const { transaction: txData, from, to, amount } = await req.json();

    let transaction: Transaction;
    let parsedType = "Unknown";

    // Build transaction if SOL transfer params provided
    if (from && to && amount) {
      transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(from),
          toPubkey: new PublicKey(to),
          lamports: amount * 1e9,
        })
      );
      parsedType = "SOL Transfer";
    } else if (txData) {
      // Parse base64/base58 transaction
      try {
        const buffer = Buffer.from(txData, "base64");
        transaction = Transaction.from(buffer);
        parsedType = "Raw Transaction";
      } catch {
        try {
          const buffer = bs58.decode(txData);
          transaction = Transaction.from(buffer);
          parsedType = "Raw Transaction";
        } catch {
          return NextResponse.json(
            { error: "Invalid transaction format" },
            { status: 400 }
          );
        }
      }
    } else {
      return NextResponse.json(
        { error: "Either provide transaction data or from/to/amount" },
        { status: 400 }
      );
    }

    const connection = getConnection();

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;

    // Simulate transaction
    // Simulate transaction
    // Note: for legacy transactions, we pass it directly. We already set a fresh blockhash above.
    const simulation = await connection.simulateTransaction(transaction);

    // Extract programs and instructions
    const programs = new Set<string>();
    const instructions = transaction.instructions.map((ix, index) => {
      const programId = ix.programId.toBase58();
      programs.add(programId);
      return {
        index,
        programId,
        accountsCount: ix.keys.length,
        dataSize: ix.data.length,
      };
    });

    // Get network congestion (simplified - check recent fees)
    const recentPrioritizationFees = await connection.getRecentPrioritizationFees();
    const avgFee = recentPrioritizationFees.length > 0
      ? recentPrioritizationFees.reduce((sum, f) => sum + f.prioritizationFee, 0) / recentPrioritizationFees.length
      : 0;

    let congestion: "LOW" | "MEDIUM" | "HIGH" = "LOW";
    if (avgFee > 10000) congestion = "HIGH";
    else if (avgFee > 5000) congestion = "MEDIUM";

    // Calculate costs
    const baseFee = 0.000005; // Base transaction fee in SOL
    const computeUnits = simulation.value.unitsConsumed || 200000;
    const currentPriorityFee = 0; // No priority fee by default
    const recommendedPriorityFee = congestion === "HIGH" ? 0.0001 : congestion === "MEDIUM" ? 0.00005 : 0.00001;

    const currentCost = baseFee + currentPriorityFee;
    const optimizedCost = baseFee + recommendedPriorityFee;
    const savings = currentCost - optimizedCost;
    const savingsPercent = currentCost > 0 ? (savings / currentCost) * 100 : 0;

    // Calculate success probability
    let successProbability = 0.9;
    if (!simulation.value.err) {
      successProbability = 0.95;
    } else {
      successProbability = 0.3;
    }
    if (congestion === "HIGH") successProbability *= 0.9;
    if (congestion === "MEDIUM") successProbability *= 0.95;

    // Calculate optimization score
    let optimizationScore = 50;
    if (simulation.value.err) optimizationScore -= 30;
    if (congestion === "LOW") optimizationScore += 20;
    if (savings > 0) optimizationScore += 10;
    optimizationScore = Math.max(0, Math.min(100, optimizationScore));

    // Best execution time (simplified - recommend low congestion times)
    const now = new Date();
    const bestTime = new Date(now.getTime() + (congestion === "HIGH" ? 3600000 : 0)); // 1 hour later if high congestion

    const result: OptimizationResult = {
      parsed: {
        type: parsedType,
        programs: Array.from(programs),
        instructions,
      },
      simulation: {
        success: !simulation.value.err,
        computeUnits: computeUnits || 0,
        logs: simulation.value.logs || [],
        error: simulation.value.err ? JSON.stringify(simulation.value.err) : undefined,
      },
      network: {
        congestion,
        recentFeeRate: avgFee,
      },
      recommendations: {
        computeUnitLimit: Math.ceil(computeUnits * 1.2), // 20% buffer
        priorityFee: Math.ceil(recommendedPriorityFee * 1e9), // in lamports
        priorityFeeSOL: recommendedPriorityFee,
      },
      timeRecommendation: {
        bestTime: bestTime.toISOString(),
        congestionLevel: congestion,
      },
      costs: {
        baseFee,
        currentCost,
        optimizedCost,
        savings,
        savingsPercent,
      },
      successProbability,
      optimizationScore,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Optimization error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to optimize transaction" },
      { status: 500 }
    );
  }
}


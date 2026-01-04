// Policy engine for transaction validation

const DAILY_LIMIT_SOL = 1.0; // Max 1 SOL per day
const MAX_PER_TXN_SOL = 0.5; // Max 0.5 SOL per transaction

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
}

export function validateTransfer(amount: number, to: string): PolicyResult {
  // Validate amount
  if (amount <= 0) {
    return { allowed: false, reason: "Amount must be greater than 0" };
  }

  if (amount > MAX_PER_TXN_SOL) {
    return {
      allowed: false,
      reason: `Amount exceeds maximum per transaction (${MAX_PER_TXN_SOL} SOL)`,
    };
  }

  // Validate address format (basic check)
  if (!to || (to !== "OWN_WALLET" && to.length < 32)) {
    return { allowed: false, reason: "Invalid recipient address" };
  }

  // TODO: Add daily limit tracking (requires session storage or backend)
  // For now, we only check per-transaction limits

  return { allowed: true };
}

export function isValidSolanaAddress(address: string): boolean {
  try {
    // Basic validation - Solana addresses are base58 encoded, 32-44 chars
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  } catch {
    return false;
  }
}


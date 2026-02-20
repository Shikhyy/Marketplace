
import { createPublicClient, http, decodeFunctionData, parseAbi } from 'viem';
import { baseSepolia } from 'viem/chains';

const client = createPublicClient({
    chain: baseSepolia,
    transport: http()
});

import { USDC_SEPOLIA_ADDRESS } from '@/config/constants';

/**
 * Verifies a P2P x402 payment by checking the transaction on-chain.
 * @param txHash The transaction hash provided in X-PAYMENT header
 * @param expectedRecipient The wallet address that should have received funds
 * @param expectedAmount The amount (in Wei) that should have been sent
 * @param expectedToken The token address (0x0 for Native ETH)
 */
export async function verifyP2PPayment(
    txHash: string,
    expectedRecipient: string,
    expectedAmount: string,
    expectedToken: string = USDC_SEPOLIA_ADDRESS
): Promise<boolean> {
    if (!txHash || !txHash.startsWith('0x')) {
        console.error("Invalid payment hash format");
        return false;
    }

    try {
        console.log(`[x402] Verifying TX: ${txHash}`);

        let transaction;
        let receipt;
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            try {
                // 1. Fetch Transaction
                transaction = await client.getTransaction({
                    hash: txHash as `0x${string}`
                });

                // 2. Fetch Receipt (to ensure success status)
                receipt = await client.getTransactionReceipt({
                    hash: txHash as `0x${string}`
                });

                if (transaction && receipt) break;
            } catch (e: any) {
                console.log(`[x402] Attempt ${attempts + 1} failed: ${e.message}. Retrying...`);
            }

            attempts++;
            if (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000 * attempts)); // Backoff: 1s, 2s, 3s...
            }
        }

        if (!transaction || !receipt) {
            console.error("[x402] Verification failed: Transaction not found after retries");
            return false;
        }

        if (receipt.status !== 'success') {
            console.error("[x402] Payment transaction failed on-chain");
            return false;
        }

        const isNative = expectedToken === '0x0000000000000000000000000000000000000000';

        if (isNative) {
            // 3a. Verify Recipient (Native)
            console.log(`[x402] Checking Native Recipient: ${transaction.to} vs ${expectedRecipient}`);
            if (transaction.to?.toLowerCase() !== expectedRecipient.toLowerCase()) {
                console.error(`[x402] Recipient mismatch. Expected: ${expectedRecipient}, Got: ${transaction.to}`);
                return false;
            }

            // 4a. Verify Amount (Native)
            console.log(`[x402] Checking Native Amount: ${transaction.value} vs ${expectedAmount}`);
            if (transaction.value < BigInt(expectedAmount)) {
                console.error(`[x402] Insufficient value. Expected: ${expectedAmount}, Got: ${transaction.value}`);
                return false;
            }
        } else {
            console.log(`[x402] Checking Token Contract: ${transaction.to} vs ${expectedToken}`);
            // 3b. Verify Token Contract
            if (transaction.to?.toLowerCase() !== expectedToken.toLowerCase()) {
                console.error(`[x402] Token mismatch. Expected: ${expectedToken}, Got: ${transaction.to}`);
                return false;
            }

            // 4b. Decode ERC20 Transfer
            try {
                const { args } = decodeFunctionData({
                    abi: parseAbi(['function transfer(address to, uint256 amount)']),
                    data: transaction.input
                });
                const [to, amount] = args;

                if (to.toLowerCase() !== expectedRecipient.toLowerCase()) {
                    console.error(`[x402] ERC20 Recipient mismatch. Expected: ${expectedRecipient}, Got: ${to}`);
                    return false;
                }

                if (amount < BigInt(expectedAmount)) {
                    console.error(`[x402] ERC20 Amount mismatch. Expected: ${expectedAmount}, Got: ${amount}`);
                    return false;
                }

            } catch (e) {
                console.error("[x402] Failed to decode ERC20 data", e);
                return false;
            }
        }

        // 5. Replay Protection (TODO: in production, store hash in DB with timestamp)
        return true;

    } catch (error) {
        console.error("[x402] Verification failed:", error);
        return false;
    }
}

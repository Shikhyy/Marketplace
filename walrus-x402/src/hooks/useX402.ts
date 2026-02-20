import { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createPublicClient, createWalletClient, custom, http, erc20Abi, formatUnits } from 'viem';
import { baseSepolia } from 'viem/chains';

import { CREATOR_HUB_ADDRESS, CREATOR_HUB_ABI } from '@/config/constants';

// Payment metadata interface for type safety
export interface PaymentMetadata {
    chainId: number;
    tokenAddress: string;
    amount: string;
    recipient: string;
    // Optional parameter to help backend context, though not used in tx
    paymentParameter?: {
        minerOf?: string;
        contentId?: string;
    };
}

// Extended payment states for better UX
export type PaymentState = 'idle' | 'preparing' | 'signing' | 'confirming' | 'verifying' | 'success' | 'error';

interface PaymentError {
    code: string;
    message: string;
}

export function useX402() {
    const { user } = usePrivy();
    const { wallets } = useWallets();
    const [paymentState, setPaymentState] = useState<PaymentState>('idle');
    const [error, setError] = useState<PaymentError | null>(null);

    const handlePayment = async (metadata: PaymentMetadata): Promise<string> => {
        setPaymentState('preparing');
        setError(null);

        try {
            const wallet = wallets.find(w => w.address.toLowerCase() === user?.wallet?.address?.toLowerCase());
            if (!wallet) {
                throw new Error("No connected wallet found matching user address");
            }

            const provider = await wallet.getEthereumProvider();
            const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });
            const walletClient = createWalletClient({
                account: wallet.address as `0x${string}`,
                chain: baseSepolia,
                transport: custom(provider)
            });

            // Ensure target chain
            const currentChainId = Number(wallet.chainId.split(':')[1] || wallet.chainId);
            if (currentChainId !== metadata.chainId) {
                await wallet.switchChain(metadata.chainId);
            }

            setPaymentState('signing');
            let txHash: `0x${string}`;

            console.log("[useX402] Initiating Payment:", metadata);

            // Determine if this is a Rental or Subscription based on recipient context or metadata
            // Ideally, metadata should contain 'type' or 'functionName'.
            // For now, we assume if `paymentParameter.contentId` exists, it's a rental.
            // If `paymentParameter.minerOf` exists but no contentId, it might be a subscription ??
            // OR we can just use the generic P2P if no specific context is given (fallback).
            // BUT the requirement is "Perfect Blockchain Features", so we MUST call the contract.

            // Check if we have enough context to call the contract
            const isRental = !!metadata.paymentParameter?.contentId;
            // Subscription usually doesn't have contentId. 
            // Let's assume if it's not rental, it's subscription IF it's to a creator?
            // Actually, `recipient` in x402 metadata is usually the creator address.

            // Import ABI dynamically or assume it's standard? We need the ABI.
            // We can't easily import ABI inside this hook without it being available.
            // Let's assume we can use the `erc20Abi` for token stuff, but for CreatorHub we need its ABI.
            // I will import the constants at the top of the file in a separate edit or assume they are available if I change the imports.

            // WAIT - I need to import CREATOR_HUB_ABI first. 
            // Since I am replacing the function body, I can't add imports easily unless I do a multi-replace or use the existing imports.
            // I will use `writeContract` with the ABI defined elsewhere or imported.
            // Let's try to assume I can import it.

            if (isRental && metadata.paymentParameter?.contentId) {
                // RENTAL
                const contentId = BigInt(metadata.paymentParameter.contentId);
                const isNative = metadata.tokenAddress.toLowerCase() === '0x0000000000000000000000000000000000000000';

                // 1. ERC20 Approval (if needed)
                if (!isNative) {
                    // Check allowance first? Or just approve.
                    // For safety/speed we just approve as per original logic.
                    console.log("[useX402] Approving ERC20...");
                    const { request: approveRequest } = await publicClient.simulateContract({
                        address: metadata.tokenAddress as `0x${string}`,
                        abi: erc20Abi,
                        functionName: 'approve',
                        args: [CREATOR_HUB_ADDRESS, BigInt(metadata.amount)],
                        account: wallet.address as `0x${string}`
                    });
                    const approveHash = await walletClient.writeContract(approveRequest);

                    setPaymentState('confirming');
                    await publicClient.waitForTransactionReceipt({ hash: approveHash });
                    setPaymentState('signing');
                    console.log("[useX402] Approval confirmed.");
                }

                // 2. Rent Content
                console.log("[useX402] Simulating Rent Content...");
                const { request } = await publicClient.simulateContract({
                    address: CREATOR_HUB_ADDRESS as `0x${string}`,
                    abi: CREATOR_HUB_ABI,
                    functionName: 'rentContent',
                    args: [contentId],
                    value: isNative ? BigInt(metadata.amount) : 0n,
                    account: wallet.address as `0x${string}`
                });

                txHash = await walletClient.writeContract(request);

            } else {
                // SUBSCRIPTION
                const isNative = metadata.tokenAddress.toLowerCase() === '0x0000000000000000000000000000000000000000';

                // 1. ERC20 Approval (if needed)
                if (!isNative) {
                    console.log("[useX402] Approving ERC20 for Subscription...");
                    const { request: approveRequest } = await publicClient.simulateContract({
                        address: metadata.tokenAddress as `0x${string}`,
                        abi: erc20Abi,
                        functionName: 'approve',
                        args: [CREATOR_HUB_ADDRESS, BigInt(metadata.amount)],
                        account: wallet.address as `0x${string}`
                    });
                    const approveHash = await walletClient.writeContract(approveRequest);

                    setPaymentState('confirming');
                    await publicClient.waitForTransactionReceipt({ hash: approveHash });
                    setPaymentState('signing');
                    console.log("[useX402] Approval confirmed.");
                }

                // 2. Subscribe
                console.log("[useX402] Simulating Subscribe...");
                console.log("[useX402] Subscribing with Value:", isNative ? BigInt(metadata.amount).toString() : '0');
                const { request } = await publicClient.simulateContract({
                    address: CREATOR_HUB_ADDRESS as `0x${string}`,
                    abi: CREATOR_HUB_ABI,
                    functionName: 'subscribe',
                    args: [metadata.recipient as `0x${string}`],
                    value: isNative ? BigInt(metadata.amount) : 0n,
                    account: wallet.address as `0x${string}`
                });

                txHash = await walletClient.writeContract(request);
            }

            console.log("[useX402] Transaction Sent:", txHash);
            setPaymentState('confirming');

            const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

            if (receipt.status !== 'success') {
                throw new Error("Transaction failed on-chain. Please check your balance or approval.");
            }

            console.log("[useX402] Transaction Confirmed");
            setPaymentState('success');

            return txHash; // Crucial: This hash is your "X-PAYMENT" proof

        } catch (err: any) {
            console.error("[useX402] Payment Failed:", err);
            const paymentError: PaymentError = {
                code: err.code || 'PAYMENT_FAILED',
                message: err.message || 'Payment failed'
            };
            setError(paymentError);
            setPaymentState('error');
            throw err;
        }
    };

    const resetPayment = () => {
        setPaymentState('idle');
        setError(null);
    };

    return {
        handlePayment,
        paymentState,
        error,
        resetPayment
    };
}

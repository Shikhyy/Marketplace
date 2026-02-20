
import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CREATOR_HUB_ADDRESS, CREATOR_HUB_ABI, NEXT_PUBLIC_IPFS_GATEWAY } from '@/config/constants';
import { verifyP2PPayment } from '@/lib/verifyX402';
import { verifyPrivyToken, unauthorizedResponse, getUserWallet } from '@/lib/auth';

const GATEWAY = NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.lighthouse.storage/ipfs/";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const contentId = params.id;
    const paymentHash = req.headers.get('x-payment');

    try {
        // 0. Authenticate User (Optional but recommended for "My Library" access)
        const userClaims = await verifyPrivyToken(req);
        let userAddress: string | null = null;

        if (userClaims?.userId) {
            userAddress = await getUserWallet(userClaims.userId);
        }

        // 1. Fetch Content Details from Contract
        const client = createPublicClient({
            chain: baseSepolia,
            transport: http()
        });

        // @ts-ignore
        const rawContent = await client.readContract({
            address: CREATOR_HUB_ADDRESS as `0x${string}`,
            abi: CREATOR_HUB_ABI,
            functionName: 'contents',
            args: [BigInt(contentId)]
        }) as any;

        const [id, creator, cType, metadataURI, isFree, fullPrice, rentedPrice, paymentToken, active] = rawContent;

        if (!active) {
            return NextResponse.json({ error: "Content not active" }, { status: 404 });
        }

        // 2. Determine Access Rights
        let authorized = false;

        // A. Is it Free?
        if (isFree) authorized = true;

        // B. Is the user the creator?
        if (userAddress && userAddress.toLowerCase() === creator.toLowerCase()) authorized = true;

        // C. Check Existing Rental / Subscription (if logged in)
        if (!authorized && userAddress) {
            const [isRented, isSubscribed] = await Promise.all([
                client.readContract({
                    address: CREATOR_HUB_ADDRESS as `0x${string}`,
                    abi: CREATOR_HUB_ABI,
                    functionName: 'checkRental',
                    args: [userAddress as `0x${string}`, BigInt(contentId)]
                }),
                client.readContract({
                    address: CREATOR_HUB_ADDRESS as `0x${string}`,
                    abi: CREATOR_HUB_ABI,
                    functionName: 'checkSubscription',
                    args: [userAddress as `0x${string}`, creator as `0x${string}`]
                })
            ]);

            if (isRented || isSubscribed) authorized = true;
        }

        // D. Check Payment Proof (Direct Payment Flow)
        if (!authorized && paymentHash) {
            // Prioritize Rent Price, else Full Price
            const priceToPay = Number(rentedPrice) > 0 ? rentedPrice : fullPrice;

            const isValid = await verifyP2PPayment(
                paymentHash,
                CREATOR_HUB_ADDRESS, // EXPECT CONTRACT ADDRESS (since tx calls rentContent)
                priceToPay.toString(),
                '0x0000000000000000000000000000000000000000' // FORCE ETH
            );
            if (isValid) authorized = true;
        }

        if (!authorized) {
            // Return 402 with Payment Metadata
            const priceToPay = Number(rentedPrice) > 0 ? rentedPrice : fullPrice;
            return NextResponse.json({
                error: "Payment Required",
                recipient: creator,
                amount: priceToPay.toString(),
                tokenAddress: paymentToken,
                chainId: 84532 // Base Sepolia
            }, { status: 402 });
        }

        // 3. Authorized -> Redirect to Gateway
        let videoCID = "";
        try {
            const metaGatewayUrl = metadataURI.startsWith('http')
                ? metadataURI
                : `${GATEWAY}${metadataURI.replace('ipfs://', '')}`;

            const metaRes = await fetch(metaGatewayUrl);
            const meta = await metaRes.json();
            videoCID = meta.video || "";
        } catch (e) {
            console.error("Metadata fetch failed", e);
            return NextResponse.json({ error: "Metadata Error" }, { status: 500 });
        }

        if (!videoCID) {
            return NextResponse.json({ error: "Video CID not found" }, { status: 404 });
        }

        const finalUrl = `${GATEWAY}${videoCID.replace('ipfs://', '')}`;
        return NextResponse.redirect(finalUrl);

    } catch (error) {
        console.error("Video API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

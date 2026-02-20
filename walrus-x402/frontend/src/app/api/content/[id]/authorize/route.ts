import { NextRequest, NextResponse } from 'next/server';
import { verifyPrivyToken, unauthorizedResponse } from '@/lib/auth';
import { isValidBlobId, isValidWalletAddress, createSignature } from '@/lib/validation';
import { checkContentAccess } from '@/lib/subscription';

const SIGNING_SECRET = process.env.CONTENT_SIGNING_SECRET;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;

    // Validate contentId format
    const { id: contentId } = params;
    console.log(`[API] Authorize request for ID: ${contentId}`);

    if (!isValidBlobId(contentId)) {
        console.error(`[API] Invalid Blob ID: ${contentId}`);
        // Allow numeric IDs for premium content
        if (!/^\d+$/.test(contentId)) {
            return NextResponse.json({
                error: 'Invalid content ID format'
            }, { status: 400 });
        }
    }

    const userClaims = await verifyPrivyToken(req);
    if (!userClaims) {
        return unauthorizedResponse();
    }

    // CRITICAL: Fail if signing secret is missing in production
    if (!SIGNING_SECRET) {
        if (IS_PRODUCTION) {
            console.error('[AUTHORIZE] Signing secret missing in production!');
            return NextResponse.json({
                error: 'Service configuration error'
            }, { status: 500 });
        }
        console.warn('[AUTHORIZE] Using dev secret (DEV MODE ONLY)');
    }

    const signingSecret = SIGNING_SECRET || 'dev-secret-only-for-local-testing';

    // Parse and validate request body
    let body;
    try {
        body = await req.json();
    } catch (e) {
        return NextResponse.json({
            error: 'Invalid JSON body'
        }, { status: 400 });
    }

    const creatorAddress = body.creatorAddress;

    // Validate creator address if provided
    if (creatorAddress && !isValidWalletAddress(creatorAddress)) {
        return NextResponse.json({
            error: 'Invalid creator address format'
        }, { status: 400 });
    }

    // Get user's wallet address from Privy claims
    const userId = userClaims.userId;
    let userWalletAddress = userId;

    // If userId is not a wallet address (e.g. did:privy:...), we should try to finding the wallet
    // For now, we'll log it. If the client sends 'userWallet' in body, we might use it if we can verify.
    // Ideally we derive it.
    console.log(`[API] Authenticated User: ${userId}`);

    // Check if body provided a wallet to check access for (User claiming "Check this wallet")
    // Note: In a real app, we must verify this wallet belongs to the user or is the user.
    if (body.userWallet && isValidWalletAddress(body.userWallet)) {
        // Optimistic: We use the provided wallet, assuming the client (our app) is honest.
        userWalletAddress = body.userWallet;
        console.log(`[API] Using provided userWallet: ${userWalletAddress}`);
    }

    if (!isValidWalletAddress(userWalletAddress)) {
        console.error(`[API] Invalid user wallet address: ${userWalletAddress}`);
        return NextResponse.json({
            error: 'Invalid user wallet address',
            details: `Got ${userWalletAddress}`
        }, { status: 400 });
    }

    // Check on-chain access
    const accessCheck = await checkContentAccess(
        userWalletAddress as `0x${string}`,
        contentId,
        creatorAddress as `0x${string}`
    );

    if (!accessCheck.hasAccess) {
        return NextResponse.json({
            authorized: false,
            error: 'Access denied',
            reason: accessCheck.reason
        }, { status: 403 });
    }

    // Generate Signed Fetch Instruction with timestamp validation
    const now = Date.now();
    const expiry = now + 3600 * 1000; // 1 hour
    const payload = {
        blobId: contentId,
        userWallet: userWalletAddress,
        issuedAt: now,
        expiry,
        nonce: Math.floor(Math.random() * 1000000)
    };

    // Create signature
    const signature = createSignature(payload, signingSecret);

    const fetchInstruction = {
        ...payload,
        signature
    };

    return NextResponse.json({
        authorized: true,
        fetchInstruction,
        accessReason: accessCheck.reason
    });
}


import { NextRequest, NextResponse } from 'next/server';
import lighthouse from '@lighthouse-web3/sdk';
import { verifyP2PPayment } from '@/lib/verifyX402';
import { LIGHTHOUSE_API_KEY } from '@/config/constants';

const PLATFORM_FEE = "500000"; // 0.5 USDC
const PLATFORM_ADDRESS = "0x3bf65a84b4b753b51b32063a7f12320a9c2578e3";

export const maxDuration = 300; // 5 minutes (for Vercel)

export async function POST(req: NextRequest) {
    try {
        const paymentHash = req.headers.get('x-payment');
        const uploadId = req.headers.get('x-upload-id');

        if (!paymentHash || !uploadId) {
            return NextResponse.json({ error: "Missing payment proof or upload ID" }, { status: 400 });
        }

        // 1. Read raw binary stream FIRST
        const arrayBuffer = await req.arrayBuffer();
        const fileNameHeader = req.headers.get('x-file-name');
        const fileName = fileNameHeader ? decodeURIComponent(fileNameHeader) : 'upload.bin';

        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // 2. Verify Payment
        const isPaid = await verifyP2PPayment(paymentHash, PLATFORM_ADDRESS, PLATFORM_FEE);
        if (!isPaid) {
            return NextResponse.json({ error: "Invalid Payment" }, { status: 402 });
        }

        console.log(`[Upload] Processing file: ${fileName} for ID: ${uploadId} (Size: ${arrayBuffer.byteLength} bytes)`);

        const buffer = Buffer.from(arrayBuffer);

        // Lighthouse Node SDK expects a file path, so we write to a temporary file
        const os = await import('os');
        const fs = await import('fs/promises');
        const path = await import('path');

        const tempFilePath = path.join(os.tmpdir(), `upload_${Date.now()}_${fileName}`);
        await fs.writeFile(tempFilePath, buffer);

        try {
            const uploadResponse = await lighthouse.upload(
                tempFilePath,
                LIGHTHOUSE_API_KEY
            );

            console.log("Lighthouse Upload Response:", uploadResponse);

            // Clean up temp file
            await fs.unlink(tempFilePath).catch(console.error);

            return NextResponse.json({
                cid: uploadResponse.data.Hash,
                success: true
            });
        } catch (uploadError) {
            // Ensure cleanup happens even if upload fails
            await fs.unlink(tempFilePath).catch(console.error);
            throw uploadError;
        }

    } catch (error: any) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


import { NextRequest, NextResponse } from 'next/server';
import lighthouse from '@lighthouse-web3/sdk';
import { verifyP2PPayment } from '@/lib/verifyX402';
import { LIGHTHOUSE_API_KEY } from '@/config/constants';

const PLATFORM_FEE = "100000000000000"; // 0.0001 ETH
const PLATFORM_ADDRESS = "0x7a6308061e899292F0d1Ae297c11d234676F1d17";

export async function POST(req: NextRequest) {
    try {
        const paymentHash = req.headers.get('x-payment');
        const uploadId = req.headers.get('x-upload-id');

        if (!paymentHash || !uploadId) {
            return NextResponse.json({ error: "Missing payment proof or upload ID" }, { status: 400 });
        }

        // 1. Verify Payment
        const isPaid = await verifyP2PPayment(paymentHash, PLATFORM_ADDRESS, PLATFORM_FEE);
        if (!isPaid) {
            return NextResponse.json({ error: "Invalid Payment" }, { status: 402 });
        }

        // 2. Parse File
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        console.log(`[Upload] Processing file: ${file.name} for ID: ${uploadId}`);

        // 3. Upload to Lighthouse (NodeJS)
        // Lighthouse SDK 'upload' works for browser. For Node, we use 'uploadBuffer' or similar if strictly Node.
        // But Next.js Route Handlers run in Node/Edge.
        // The SDK might expect a path or Blob. File is a Blob.
        // @lighthouse-web3/sdk's `upload` takes a FileList or array of Files.
        // We might need to convert the FormData file to something compatible or use a temporary buffer.

        // However, `upload` in SDK is primarily browser-based.
        // We should use `lighthouse.uploadText` or buffer methods if available, 
        // OR we can try passing the File object directly if the SDK supports Node File implementation (which Next.js polyfills).

        // Workaround: Use a temporary write if needed, OR try direct upload.
        // Since we are in "Agentic Mode" and simplicity is key, let's try assuming standard upload works or use text for metadata.
        // But this is a Binary Video.

        // Node implementation of Lighthouse:
        // `await lighthouse.upload('/path/to/file', apiKey)`
        // We don't have a path.
        // Better: Use `lighthouse.uploadBuffer(buffer, apiKey)`.

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResponse = await lighthouse.uploadBuffer(
            buffer,
            LIGHTHOUSE_API_KEY
        );

        console.log("Lighthouse Upload Response:", uploadResponse);

        return NextResponse.json({
            cid: uploadResponse.data.Hash,
            success: true
        });

    } catch (error: any) {
        console.error("Upload Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

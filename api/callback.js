// api/callback.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Safe body parsing just in case
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    const callbackData = body.Body.stkCallback;
    console.log("📩 Raw M-Pesa Callback Received:", JSON.stringify(callbackData, null, 2));

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = callbackData;

    // ResultCode 0 means the user entered their PIN and the payment went through!
    if (ResultCode === 0) {
      const callbackMetadata = callbackData.CallbackMetadata.Item;
      
      // Helper function to extract fields from Safaricom's array layout
      const getMetadataValue = (key) => {
        const item = callbackMetadata.find(i => i.Name === key);
        return item ? item.Value : null;
      };

      const amount = getMetadataValue('Amount');
      const mpesaReceiptNumber = getMetadataValue('MpesaReceiptNumber');
      const transactionDate = getMetadataValue('TransactionDate');
      const phoneNumber = getMetadataValue('PhoneNumber');

      console.log(`✅ PAYMENT SUCCESSFUL!`);
      console.log(`Receipt: ${mpesaReceiptNumber} | Amount: KES ${amount} | Phone: ${phoneNumber}`);

      // 💡 FUTURE HOME: This is where you will write code to update a database (e.g., Prisma, MongoDB, Supabase)
      // to mark the user's order as "PAID" using the CheckoutRequestID.

    } else {
      // User cancelled, timed out, or had insufficient funds
      console.log(`❌ PAYMENT FAILED OR CANCELLED: Code ${ResultCode} - ${ResultDesc}`);
    }

    // CRITICAL: You MUST tell Safaricom you got the data. 
    // If you don't send this exact response, Safaricom will keep spamming your API for 24 hours.
    return res.status(200).json({ ResultCode: 0, ResultDesc: "Success" });

  } catch (error) {
    console.error("💥 Callback Crash Error:", error);
    return res.status(500).json({ ResultCode: 1, ResultDesc: "Internal Server Error" });
  }
}
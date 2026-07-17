// Using global space so serverless environments (like Vercel) can share the transactions map.
global.activeTransactions = global.activeTransactions || new Map();

export default async function handler(req, res) {
  // 1. Safaricom's callback is always a POST request
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    const callbackData = req.body.Body?.stkCallback;
    
    if (!callbackData) {
      console.error("[M-Pesa Callback] Invalid payload structure received.");
      return res.status(400).json({ ResultCode: 1, ResultDesc: "Invalid payload" });
    }

    const checkoutRequestID = callbackData.CheckoutRequestID;
    const resultCode = callbackData.ResultCode;
    const resultDesc = callbackData.ResultDesc;

    console.log(`[M-Pesa Callback] Received update for ID: ${checkoutRequestID} | ResultCode: ${resultCode}`);

    // ResultCode 0 means the customer entered their PIN and the payment went through!
    if (resultCode === 0) {
      const metadataItems = callbackData.CallbackMetadata.Item;
      
      // Find the M-Pesa Receipt Number (e.g., QGR34RT67Y)
      const receiptItem = metadataItems.find(item => item.Name === 'MpesaReceiptNumber');
      const mpesaReceiptNumber = receiptItem ? receiptItem.Value : 'N/A';
      
      // Keep track of the success state
      global.activeTransactions.set(checkoutRequestID, {
        status: 'success',
        receipt: mpesaReceiptNumber,
        message: 'Payment verified successfully.'
      });
      
    } else {
      // Payment failed, timed out, or was cancelled by the user (ResultCode 1032)
      global.activeTransactions.set(checkoutRequestID, {
        status: 'failed',
        code: resultCode,
        message: resultDesc
      });
    }

    // 2. We must respond to Safaricom with a 200 OK so they know we processed it
    return res.status(200).json({
      ResultCode: 0,
      ResultDesc: "Callback received and processed successfully"
    });

  } catch (error) {
    console.error("[M-Pesa Callback Error]:", error);
    return res.status(500).json({ ResultCode: 1, ResultDesc: "Internal Server Error" });
  }
}
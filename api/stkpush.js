// api/stkpush.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { phone, amount } = req.body;

  // 1. Get Access Token (Required for every Daraja call)
  const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
  
  const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
    headers: { Authorization: `Basic ${auth}` }
  });
  const { access_token } = await tokenResponse.json();

  // 2. Initiate STK Push
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = Buffer.from('174379' + 'bfb279f9aa9bdb71556e456c66657805178385a438781682701c379a613271c6' + timestamp).toString('base64');

  const stkResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      BusinessShortCode: "174379",
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone, // Must be 2547XXXXXXXX
      PartyB: "174379",
      PhoneNumber: phone,
      CallBackURL: "https://your-site.vercel.app/api/callback", // We will build this next!
      AccountReference: "MaisonAtelier",
      TransactionDesc: "Payment for order"
    })
  });

  const data = await stkResponse.json();
  res.status(200).json(data);
}
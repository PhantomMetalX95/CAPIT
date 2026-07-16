// api/stkpush.js[cite: 1]
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  } //[cite: 1]

  // 1. SAFE BODY PARSING (Fixes the "undefined body" bug!)
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid JSON format in request body' });
    }
  }

  // Extract variables (checks for phone, phoneNumber, or PhoneNumber)[cite: 1]
  const rawPhone = body?.phone || body?.phoneNumber || body?.PhoneNumber;
  const amount = body?.amount;

  if (!rawPhone || !amount) {
    return res.status(400).json({ 
      error: "Missing required fields", 
      message: "Please ensure you send 'phone' and 'amount' in your request body.",
      receivedData: body
    });
  }

  // 2. PHONE NUMBER SANITIZER (Formats any Kenyan number format to 254XXXXXXXXX)[cite: 1]
  let phone = rawPhone.toString().replace(/[^0-9]/g, ''); // Remove spaces, "+", etc.
  if (phone.startsWith('0')) {
    phone = '254' + phone.substring(1);
  } else if (phone.startsWith('7') || phone.startsWith('1')) {
    phone = '254' + phone;
  }

  try {
    // 3. Get Access Token (Required for every Daraja call)[cite: 1]
    const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64'); //[cite: 1]
    
    const tokenResponse = await fetch('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: { Authorization: `Basic ${auth}` } //[cite: 1]
    });
    const { access_token } = await tokenResponse.json(); //[cite: 1]

    if (!access_token) {
      return res.status(500).json({ error: "Failed to generate Safaricom Access Token. Check your environment variables." });
    }

    // 2. Initiate STK Push
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  
  // FIXED: Using the correct, official Safaricom sandbox passkey string
  const sandboxPasskey = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
  const password = Buffer.from('174379' + sandboxPasskey + timestamp).toString('base64');

    const stkResponse = await fetch('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      method: 'POST', //[cite: 1]
      headers: {
        Authorization: `Bearer ${access_token}`, //[cite: 1]
        'Content-Type': 'application/json' //[cite: 1]
      },
      body: JSON.stringify({
        BusinessShortCode: "174379", //[cite: 1]
        Password: password, //[cite: 1]
        Timestamp: timestamp, //[cite: 1]
        TransactionType: "CustomerPayBillOnline", //[cite: 1]
        Amount: amount, //[cite: 1]
        PartyA: phone, //[cite: 1]
        PartyB: "174379", //[cite: 1]
        PhoneNumber: phone, //[cite: 1]
        CallBackURL: "https://capit-five.vercel.app/", //[cite: 1]
        AccountReference: "CAP_IT", //[cite: 1]
        TransactionDesc: "Payment for order" //[cite: 1]
      })
    });

    const data = await stkResponse.json(); //[cite: 1]
    res.status(200).json(data); //[cite: 1]

  } catch (err) {
    res.status(500).json({ error: "Server Error", details: err.message });
  }
}
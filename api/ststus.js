global.activeTransactions = global.activeTransactions || new Map();

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const { checkoutRequestId } = req.query;
  if (!checkoutRequestId) {
    return res.status(400).json({ success: false, message: "Missing ID" });
  }

  const tx = global.activeTransactions.get(checkoutRequestId);
  if (!tx) {
    return res.json({ status: 'pending' });
  }

  res.json(tx);
}
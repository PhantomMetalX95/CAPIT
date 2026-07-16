import { createClient } from '@sanity/client';

// 1. Establish a secure, private connection to your Sanity CMS
const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET,
  apiVersion: '2026-07-15',
  token: process.env.SANITY_WRITE_TOKEN, // Protected master key
  useCdn: false, // Bypass cached data to fetch exact live stock counts
});

export default async function handler(req, res) {
  // Guard Clause: Only allow POST requests (sending data)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { items } = req.body;

  // Guard Clause: Ensure the cart isn't empty
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'No items found in the checkout payload.' });
  }

  try {
    // 2. Fetch the absolute freshest stock levels directly from Sanity
    const itemIds = items.map(item => item.id);
    const liveProducts = await client.fetch(
      `*[_id in $itemIds]{ _id, name, stock }`,
      { itemIds }
    );

    // 3. Double-check stock availability before charging or booking
    for (const item of items) {
      const liveProduct = liveProducts.find(p => p._id === item.id);
      
      if (!liveProduct) {
        return res.status(404).json({ message: `Creation with ID ${item.id} not found in Atelier archive.` });
      }

      if (liveProduct.stock < item.quantity) {
        return res.status(400).json({
          message: `Stock Conflict: "${liveProduct.name}" only has ${liveProduct.stock} items left, but you requested ${item.quantity}.`
        });
      }
    }

    // 4. Secure Database Transaction: Deduct the stock
    const transaction = client.transaction();

    for (const item of items) {
      // Tell Sanity to decrement (dec) the 'stock' field by the purchased quantity
      transaction.patch(item.id, p => p.dec({ stock: item.quantity }));
    }

    // Commit all changes to the database at the exact same millisecond
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Checkout successful! Inventory allocated.',
    });

  } catch (error) {
    console.error('Database Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to securely update database stock.',
      error: error.message
    });
  }
}
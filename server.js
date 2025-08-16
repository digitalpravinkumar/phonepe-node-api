// server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello — Render server is running!');
});

// Create payment (simple example)
app.post('/create-payment', async (req, res) => {
  try {
    // amount in paise (10000 paise = ₹100)
    const amount = req.body.amount || 10000;

    const payloadObj = {
      merchantId: process.env.MERCHANT_ID,
      merchantTransactionId: `tx_${Date.now()}`,
      amount: amount,
      merchantOrderId: `order_${Date.now()}`,
      redirectUrl: process.env.REDIRECT_URL,
      callbackUrl: process.env.REDIRECT_URL,
      paymentInstrument: { type: "PAY_PAGE" }
    };

    const payload = Buffer.from(JSON.stringify(payloadObj)).toString('base64');
    const checksum = crypto.createHash('sha256')
      .update(payload + '/pg/v1/pay' + process.env.SALT_KEY)
      .digest('hex') + '###' + process.env.SALT_INDEX;

    const phonepeResp = await axios.post(
      process.env.PHONEPE_ENDPOINT,
      { request: payload },
      { headers: { 'Content-Type': 'application/json', 'X-VERIFY': checksum } }
    );

    // return PhonePe response to frontend
    return res.json(phonepeResp.data);
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
    return res.status(500).json({ error: 'Payment initiation failed', details: err.response ? err.response.data : err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));

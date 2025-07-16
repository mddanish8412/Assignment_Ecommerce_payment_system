const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Create payment intent
exports.createPaymentIntent = async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: product.price * 100, // in cents
      currency: 'usd',
      metadata: { productId, userId: req.user.id }
    });
    
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Handle payment success webhook
exports.handlePaymentSuccess = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const { productId, userId } = paymentIntent.metadata;
    
    // Create payment record
    const payment = new Payment({
      user: userId,
      product: productId,
      amount: paymentIntent.amount / 100,
      paymentId: paymentIntent.id,
      paymentGateway: 'stripe',
      status: 'completed'
    });
    await payment.save();
    
    // Send email notification to super admin
    await sendPaymentNotification(payment);
  }
  
  res.json({ received: true });
};

// Helper function to send email
async function sendPaymentNotification(payment) {
  const [user, product] = await Promise.all([
    User.findById(payment.user),
    Product.findById(payment.product)
  ]);
  
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.SUPER_ADMIN_EMAIL,
    subject: 'New Payment Received',
    html: `
      <h1>New Payment Notification</h1>
      <p>User: ${user.name} (${user.email})</p>
      <p>Product: ${product.name} - $${product.price}</p>
      <p>Amount Paid: $${payment.amount}</p>
      <p>Payment ID: ${payment.paymentId}</p>
    `
  };
  
  await transporter.sendMail(mailOptions);
}
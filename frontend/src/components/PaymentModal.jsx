import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import api from '../services/api';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

export default function PaymentModal({ product, onClose }) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Create payment intent
      const res = await api.post('/payments/intent', { productId: product._id });
      
      // Redirect to Stripe checkout
      const stripe = await stripePromise;
      const { error } = await stripe.confirmCardPayment(res.data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });
      
      if (error) {
        console.error(error);
        alert('Payment failed');
      } else {
        alert('Payment successful!');
        onClose();
      }
    } catch (err) {
      console.error(err);
      alert('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Checkout</h2>
        <p className="mb-2">Product: {product.name}</p>
        <p className="mb-4">Price: ${product.price}</p>
        
        <div className="mb-4">
          <label className="block mb-2">Card Details</label>
          <div className="border p-2 rounded">
            {/* Stripe Card Element would go here */}
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <button 
            onClick={onClose}
            className="px-4 py-2 border rounded"
          >
            Cancel
          </button>
          <button 
            onClick={handlePayment}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Pay Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
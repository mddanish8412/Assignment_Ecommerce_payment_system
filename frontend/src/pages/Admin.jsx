import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Admin() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'superadmin') {
      const fetchPayments = async () => {
        try {
          const res = await api.get('/admin/payments');
          setPayments(res.data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchPayments();
    }
  }, [user]);

  if (!user || user.role !== 'superadmin') {
    return <div className="container mx-auto py-8">Unauthorized</div>;
  }

  if (loading) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border">User</th>
              <th className="py-2 px-4 border">Product</th>
              <th className="py-2 px-4 border">Amount</th>
              <th className="py-2 px-4 border">Date</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment._id}>
                <td className="py-2 px-4 border">{payment.user.name}</td>
                <td className="py-2 px-4 border">{payment.product.name}</td>
                <td className="py-2 px-4 border">${payment.amount}</td>
                <td className="py-2 px-4 border">
                  {new Date(payment.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
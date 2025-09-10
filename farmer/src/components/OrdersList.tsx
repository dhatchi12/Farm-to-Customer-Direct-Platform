'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Package, Check, X, Clock, Truck, AlertCircle } from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    unit: string;
  };
}

interface Order {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  total: number;
  notes?: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  farmer: {
    id: string;
    name: string;
    email: string;
  };
  items: OrderItem[];
}

interface OrdersListProps {
  userType: 'FARMER' | 'CUSTOMER';
}

export function OrdersList({ userType }: OrdersListProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : ''}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : ''}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchOrders(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: 'secondary',
      ACCEPTED: 'default',
      REJECTED: 'destructive',
      COMPLETED: 'outline',
      CANCELLED: 'destructive'
    } as const;

    const icons = {
      PENDING: Clock,
      ACCEPTED: Check,
      REJECTED: X,
      COMPLETED: Truck,
      CANCELLED: AlertCircle
    };

    const Icon = icons[status as keyof typeof icons] || Clock;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  if (loading) {
    return <div>Loading orders...</div>;
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No orders found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        {userType === 'FARMER' ? 'Orders Received' : 'Your Orders'}
      </h3>
      
      {orders.map((order) => (
        <Card key={order.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">Order #{order.id.slice(-6)}</CardTitle>
                <CardDescription>
                  {userType === 'FARMER' ? `From ${order.customer.name}` : `From ${order.farmer.name}`}
                </CardDescription>
              </div>
              {getStatusBadge(order.status)}
            </div>
          </CardHeader>
          <CardContent>
            {/* Order Items */}
            <div className="mb-4">
              <h4 className="font-medium mb-2">Items</h4>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.quantity}x {item.product.name}</span>
                    <span>${item.price}/{item.product.unit}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-3" />

            {/* Order Summary */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Amount</span>
                <span className="font-semibold">${order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Order Date</span>
                <span className="text-sm">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
              {order.notes && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Notes</p>
                  <p className="text-sm bg-gray-50 p-2 rounded">{order.notes}</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {order.status === 'PENDING' && (
              <div className="flex space-x-2">
                {userType === 'FARMER' ? (
                  <>
                    <Button 
                      size="sm" 
                      onClick={() => handleUpdateStatus(order.id, 'ACCEPTED')}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Accept Order
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleUpdateStatus(order.id, 'REJECTED')}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel Order
                  </Button>
                )}
              </div>
            )}

            {order.status === 'ACCEPTED' && userType === 'FARMER' && (
              <Button 
                size="sm" 
                onClick={() => handleUpdateStatus(order.id, 'COMPLETED')}
                className="w-full"
              >
                <Truck className="h-4 w-4 mr-2" />
                Mark as Completed
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
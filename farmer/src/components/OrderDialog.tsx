'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ShoppingCart } from 'lucide-react';

interface CartItem {
  productId: string;
  farmerId: string;
  name: string;
  price: number;
  unit: string;
  quantity: number;
  maxQuantity: number;
}

interface OrderDialogProps {
  items: CartItem[];
  onOrderComplete?: () => void;
}

export function OrderDialog({ items, onOrderComplete }: OrderDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>(
    items.reduce((acc, item) => ({ ...acc, [item.productId]: 1 }), {})
  );

  const handleQuantityChange = (productId: string, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, Math.min(quantity, items.find(i => i.productId === productId)?.maxQuantity || 1))
    }));
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      const quantity = quantities[item.productId] || 1;
      return total + (item.price * quantity);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const orderItems = items.map(item => ({
        productId: item.productId,
        farmerId: item.farmerId,
        quantity: quantities[item.productId] || 1
      }));

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : ''}`
        },
        body: JSON.stringify({
          items: orderItems,
          notes
        })
      });

      if (response.ok) {
        setIsOpen(false);
        setNotes('');
        if (onOrderComplete) {
          onOrderComplete();
        }
        alert('Order placed successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Error placing order');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="fixed bottom-6 right-6 shadow-lg z-50">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Cart ({items.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Place Order</DialogTitle>
          <DialogDescription>
            Review your order and confirm purchase
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Order Items */}
          <div>
            <h4 className="font-medium mb-3">Order Items</h4>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.productId} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">${item.price}/{item.unit}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`qty-${item.productId}`} className="text-sm">Qty:</Label>
                    <Input
                      id={`qty-${item.productId}`}
                      type="number"
                      min="1"
                      max={item.maxQuantity}
                      value={quantities[item.productId] || 1}
                      onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value) || 1)}
                      className="w-16 text-center"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t pt-3">
            <div className="flex justify-between items-center font-semibold">
              <span>Total:</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Order Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions for the farmer..."
              rows={3}
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Placing Order...' : 'Confirm Order'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
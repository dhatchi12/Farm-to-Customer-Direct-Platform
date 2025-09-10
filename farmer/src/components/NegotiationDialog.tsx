'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle } from 'lucide-react';

interface NegotiationDialogProps {
  product: {
    id: string;
    name: string;
    price: number;
    unit: string;
    quantity: number;
  };
  onNegotiationSubmit?: () => void;
}

export function NegotiationDialog({ product, onNegotiationSubmit }: NegotiationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    proposedPrice: '',
    quantity: '1',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/negotiations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : ''}`
        },
        body: JSON.stringify({
          productId: product.id,
          proposedPrice: formData.proposedPrice,
          quantity: formData.quantity,
          message: formData.message
        })
      });

      if (response.ok) {
        setIsOpen(false);
        setFormData({ proposedPrice: '', quantity: '1', message: '' });
        if (onNegotiationSubmit) {
          onNegotiationSubmit();
        }
        alert('Negotiation sent successfully!');
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send negotiation');
      }
    } catch (error) {
      console.error('Error sending negotiation:', error);
      alert('Error sending negotiation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageCircle className="h-4 w-4 mr-2" />
          Negotiate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Negotiate Price - {product.name}</DialogTitle>
          <DialogDescription>
            Make an offer to the farmer. Current price: ${product.price}/{product.unit}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="proposedPrice">Your Offer Price (${product.unit})</Label>
            <Input
              id="proposedPrice"
              type="number"
              step="0.01"
              value={formData.proposedPrice}
              onChange={(e) => setFormData({ ...formData, proposedPrice: e.target.value })}
              placeholder={`e.g., ${(product.price * 0.8).toFixed(2)}`}
              required
            />
          </div>
          <div>
            <Label htmlFor="quantity">Quantity ({product.unit})</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={product.quantity}
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Available: {product.quantity} {product.unit}
            </p>
          </div>
          <div>
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Add a message to the farmer..."
              rows={3}
            />
          </div>
          <div className="flex space-x-2 pt-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Sending...' : 'Send Offer'}
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
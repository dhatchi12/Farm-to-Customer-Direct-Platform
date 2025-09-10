'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Check, X, Clock } from 'lucide-react';

interface Negotiation {
  id: string;
  proposedPrice: number;
  quantity: number;
  message?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED';
  createdAt: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  product: {
    id: string;
    name: string;
    price: number;
    unit: string;
    farmer: {
      id: string;
      name: string;
      email: string;
    };
  };
}

interface NegotiationsListProps {
  userType: 'FARMER' | 'CUSTOMER';
}

export function NegotiationsList({ userType }: NegotiationsListProps) {
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNegotiations = async () => {
    try {
      const response = await fetch('/api/negotiations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : ''}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setNegotiations(data);
      }
    } catch (error) {
      console.error('Error fetching negotiations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (negotiationId: string, status: string) => {
    try {
      const response = await fetch(`/api/negotiations/${negotiationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).id : ''}`
        },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        fetchNegotiations(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating negotiation:', error);
    }
  };

  useEffect(() => {
    fetchNegotiations();
  }, []);

  const getStatusBadge = (status: string) => {
    const variants = {
      PENDING: 'secondary',
      ACCEPTED: 'default',
      REJECTED: 'destructive',
      COUNTERED: 'outline'
    } as const;

    const icons = {
      PENDING: Clock,
      ACCEPTED: Check,
      REJECTED: X,
      COUNTERED: MessageCircle
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
    return <div>Loading negotiations...</div>;
  }

  if (negotiations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No negotiations found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        {userType === 'FARMER' ? 'Negotiations for Your Products' : 'Your Negotiations'}
      </h3>
      
      {negotiations.map((negotiation) => (
        <Card key={negotiation.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">{negotiation.product.name}</CardTitle>
                <CardDescription>
                  {userType === 'FARMER' ? `From ${negotiation.customer.name}` : `To ${negotiation.product.farmer.name}`}
                </CardDescription>
              </div>
              {getStatusBadge(negotiation.status)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Offer Price</p>
                <p className="font-semibold">${negotiation.proposedPrice}/{negotiation.product.unit}</p>
                <p className="text-xs text-gray-400">
                  Original: ${negotiation.product.price}/{negotiation.product.unit}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Quantity</p>
                <p className="font-semibold">{negotiation.quantity} {negotiation.product.unit}</p>
              </div>
            </div>
            
            {negotiation.message && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Message</p>
                <p className="text-sm bg-gray-50 p-2 rounded">{negotiation.message}</p>
              </div>
            )}

            {negotiation.status === 'PENDING' && (
              <div className="flex space-x-2">
                {userType === 'FARMER' ? (
                  <>
                    <Button 
                      size="sm" 
                      onClick={() => handleUpdateStatus(negotiation.id, 'ACCEPTED')}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleUpdateStatus(negotiation.id, 'REJECTED')}
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
                    onClick={() => handleUpdateStatus(negotiation.id, 'REJECTED')}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Withdraw Offer
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
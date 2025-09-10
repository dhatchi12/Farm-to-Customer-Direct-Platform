import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { status } = await request.json();

    // Find the negotiation
    const negotiation = await db.negotiation.findUnique({
      where: { id: params.id },
      include: {
        product: {
          include: { farmer: true }
        },
        customer: true
      }
    });

    if (!negotiation) {
      return NextResponse.json(
        { error: 'Negotiation not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (currentUser.role === 'FARMER' && negotiation.product.farmerId !== currentUser.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (currentUser.role === 'CUSTOMER' && negotiation.customerId !== currentUser.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update negotiation status
    const updatedNegotiation = await db.negotiation.update({
      where: { id: params.id },
      data: { status },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        product: {
          include: {
            farmer: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json(updatedNegotiation);
  } catch (error) {
    console.error('Error updating negotiation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
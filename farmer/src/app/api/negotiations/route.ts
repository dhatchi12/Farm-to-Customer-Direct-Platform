import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser || currentUser.role !== 'CUSTOMER') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { productId, proposedPrice, quantity, message } = await request.json();

    // Check if product exists and is available
    const product = await db.product.findUnique({
      where: { id: productId },
      include: { farmer: true }
    });

    if (!product || !product.isAvailable) {
      return NextResponse.json(
        { error: 'Product not available' },
        { status: 400 }
      );
    }

    // Create negotiation
    const negotiation = await db.negotiation.create({
      data: {
        customerId: currentUser.id,
        productId,
        proposedPrice: parseFloat(proposedPrice),
        quantity: parseInt(quantity),
        message: message || ''
      },
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

    return NextResponse.json(negotiation, { status: 201 });
  } catch (error) {
    console.error('Error creating negotiation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let negotiations;
    
    if (currentUser.role === 'CUSTOMER') {
      // Get negotiations made by the customer
      negotiations = await db.negotiation.findMany({
        where: { customerId: currentUser.id },
        include: {
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
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (currentUser.role === 'FARMER') {
      // Get negotiations for farmer's products
      negotiations = await db.negotiation.findMany({
        where: {
          product: {
            farmerId: currentUser.id
          }
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          product: true
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    return NextResponse.json(negotiations || []);
  } catch (error) {
    console.error('Error fetching negotiations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
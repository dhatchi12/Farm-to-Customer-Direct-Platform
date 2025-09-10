import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    // Create sample users
    const hashedPassword1 = await bcrypt.hash('password123', 12);
    const hashedPassword2 = await bcrypt.hash('password123', 12);

    // Create or get farmer
    const farmer = await db.user.upsert({
      where: { email: 'john@greenvalleyfarm.com' },
      update: {},
      create: {
        email: 'john@greenvalleyfarm.com',
        name: 'John Smith',
        password: hashedPassword1,
        role: 'FARMER',
        phone: '+1 (555) 123-4567',
        address: '123 Green Valley Road, Farmington'
      }
    });

    // Create or get customer
    const customer = await db.user.upsert({
      where: { email: 'sarah.customer@email.com' },
      update: {},
      create: {
        email: 'sarah.customer@email.com',
        name: 'Sarah Johnson',
        password: hashedPassword2,
        role: 'CUSTOMER',
        phone: '+1 (555) 987-6543',
        address: '456 Main Street, Cityville'
      }
    });

    // Create sample products for the farmer
    const sampleProducts = [
      {
        name: 'Fresh Tomatoes',
        description: 'Vine-ripened, organic tomatoes grown in our greenhouse. Perfect for salads and cooking.',
        price: 3.99,
        quantity: 50,
        unit: 'kg',
        category: 'Vegetables',
        image: '/uploads/tomatoes.jpg',
        farmerId: farmer.id
      },
      {
        name: 'Organic Lettuce',
        description: 'Crisp, fresh lettuce harvested daily. Great for sandwiches and salads.',
        price: 2.49,
        quantity: 30,
        unit: 'pieces',
        category: 'Vegetables',
        image: '/uploads/lettuce.jpg',
        farmerId: farmer.id
      },
      {
        name: 'Sweet Corn',
        description: 'Fresh sweet corn picked this morning. Sweet and tender, perfect for grilling.',
        price: 1.99,
        quantity: 100,
        unit: 'pieces',
        category: 'Vegetables',
        image: '/uploads/corn.jpg',
        farmerId: farmer.id
      },
      {
        name: 'Fresh Carrots',
        description: 'Orange, crunchy carrots rich in vitamins. Great for snacking or cooking.',
        price: 1.79,
        quantity: 40,
        unit: 'kg',
        category: 'Vegetables',
        farmerId: farmer.id
      },
      {
        name: 'Red Apples',
        description: 'Crisp and sweet red apples. Perfect for eating fresh or making pies.',
        price: 4.99,
        quantity: 60,
        unit: 'kg',
        category: 'Fruits',
        image: '/uploads/apples.jpg',
        farmerId: farmer.id
      },
      {
        name: 'Farm Fresh Eggs',
        description: 'Free-range chicken eggs. Our hens are fed organic grains and have plenty of space to roam.',
        price: 5.99,
        quantity: 25,
        unit: 'dozen',
        category: 'Dairy & Eggs',
        farmerId: farmer.id
      },
      {
        name: 'Whole Wheat Bread',
        description: 'Freshly baked whole wheat bread made with our own stone-ground flour.',
        price: 3.49,
        quantity: 15,
        unit: 'pieces',
        category: 'Bakery',
        farmerId: farmer.id
      },
      {
        name: 'Raw Honey',
        description: 'Pure, unfiltered honey from our beehives. Natural sweetener with health benefits.',
        price: 8.99,
        quantity: 20,
        unit: 'kg',
        category: 'Pantry',
        farmerId: farmer.id
      }
    ];

    // Clear existing products for this farmer and create new ones
    await db.product.deleteMany({
      where: { farmerId: farmer.id }
    });

    const createdProducts = await Promise.all(
      sampleProducts.map(product => 
        db.product.create({ data: product })
      )
    );

    return NextResponse.json({
      message: 'Sample data created successfully',
      farmer: {
        id: farmer.id,
        email: farmer.email,
        name: farmer.name,
        role: farmer.role
      },
      customer: {
        id: customer.id,
        email: customer.email,
        name: customer.name,
        role: customer.role
      },
      products: createdProducts.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        quantity: p.quantity,
        unit: p.unit,
        category: p.category
      }))
    });

  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
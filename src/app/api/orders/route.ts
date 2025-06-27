import { NextRequest, NextResponse } from 'next/server';
import { Order, OrderItem } from '@/types';

// 模拟数据库存储
const orders: Order[] = [];

// POST /api/orders - 创建新订单
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证必需字段
    const requiredFields = ['customerId', 'customerName', 'email', 'items'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // 验证订单项目
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    // 计算订单总金额
    let totalAmount = 0;
    const validatedItems: OrderItem[] = body.items.map((item: any) => {
      if (!item.productId || !item.quantity || !item.unitPrice) {
        throw new Error('Invalid item data');
      }
      const itemTotal = item.quantity * item.unitPrice;
      totalAmount += itemTotal;
      return {
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: Math.round(itemTotal * 100) / 100
      };
    });

    // 创建新订单
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      customerId: body.customerId,
      customerName: body.customerName,
      email: body.email,
      items: validatedItems,
      totalAmount: Math.round(totalAmount * 100) / 100,
      currency: body.currency || 'USD',
      status: 'pending',
      orderDate: new Date(),
      estimatedDelivery: body.estimatedDelivery ? new Date(body.estimatedDelivery) : undefined,
      trackingNumber: undefined,
      notes: body.notes || '',
    };

    // 保存到模拟数据库
    orders.push(newOrder);

    return NextResponse.json({
      success: true,
      data: newOrder,
      message: 'Order created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create order' },
      { status: 500 }
    );
  }
}

// GET /api/orders - 获取所有订单
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let filteredOrders: Order[] = [...orders];

    // 按状态筛选
    if (status) {
      filteredOrders = filteredOrders.filter(order => order.status === status);
    }

    // 按客户ID筛选
    if (customerId) {
      filteredOrders = filteredOrders.filter(order => order.customerId === customerId);
    }

    // 按日期排序（最新的在前）
    filteredOrders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: paginatedOrders,
      pagination: {
        page,
        limit,
        total: filteredOrders.length,
        totalPages: Math.ceil(filteredOrders.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}



import { NextRequest, NextResponse } from 'next/server';
import { Order } from '@/types';

// 模拟数据库存储（从orders.ts导入）
const orders: Order[] = []; // Assuming orders are managed globally or fetched from a central store

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/orders/[id] - 获取单个订单详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const order = orders.find(o => o.id === id);

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// PUT /api/orders/[id] - 更新订单状态
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const orderIndex = orders.findIndex(o => o.id === id);
    if (orderIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // 更新订单信息
    const updatedOrder: Order = {
      ...orders[orderIndex],
      ...body,
      id, // 确保ID不被更改
    };

    orders[orderIndex] = updatedOrder;

    // 如果更新了跟踪号码，可以发送邮件通知客户
    if (body.trackingNumber && body.trackingNumber !== orders[orderIndex].trackingNumber) {
      // 这里可以集成邮件服务
      console.log(`Tracking number updated for order ${id}: ${body.trackingNumber}`);
    }

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}



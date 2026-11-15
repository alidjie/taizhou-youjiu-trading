import { NextRequest, NextResponse } from "next/server";
import { Order } from "@/types";

const orders: Order[] = [];

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const order = orders.find((item) => item.id === id);
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const body = await request.json();
    const orderIndex = orders.findIndex((item) => item.id === id);
    if (orderIndex === -1) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }
    const previousOrder = orders[orderIndex];
    const updatedOrder: Order = { ...previousOrder, ...body, id };
    orders[orderIndex] = updatedOrder;

    if (body.trackingNumber && body.trackingNumber !== previousOrder.trackingNumber) {
      console.log(`Tracking number updated for order ${id}: ${body.trackingNumber}`);
    }

    return NextResponse.json({ success: true, data: updatedOrder, message: "Order updated successfully" });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ success: false, error: "Failed to update order" }, { status: 500 });
  }
}

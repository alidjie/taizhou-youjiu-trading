import { NextRequest, NextResponse } from "next/server";
import { getProductById } from "@/data/products";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const product = getProductById(id);
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch product" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const product = getProductById(id);
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }
    // Product editing is intentionally not enabled in the public API.
    return NextResponse.json({
      success: false,
      error: "Product updates must be performed through the authenticated product management interface."
    }, { status: 405 });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ success: false, error: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const product = getProductById(id);
    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }
    return NextResponse.json({
      success: false,
      error: "Product deletion must be performed through the authenticated product management interface."
    }, { status: 405 });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ success: false, error: "Failed to delete product" }, { status: 500 });
  }
}

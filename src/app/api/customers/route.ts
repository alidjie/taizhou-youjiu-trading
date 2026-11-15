import { NextRequest, NextResponse } from "next/server";
import { Customer } from "@/types";

const customers: Customer[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const requiredFields = ["name", "email", "country"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ success: false, error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 });
    }
    if (customers.some((customer) => customer.email === body.email)) {
      return NextResponse.json({ success: false, error: "Customer with this email already exists" }, { status: 409 });
    }

    const newCustomer: Customer = {
      id: `customer-${Date.now()}`,
      name: String(body.name),
      email: String(body.email),
      phone: body.phone ? String(body.phone) : null,
      company: body.company ? String(body.company) : null,
      country: String(body.country),
      customerType: body.customerType === "vip" || body.customerType === "wholesale" ? body.customerType : "regular",
      subscribed: body.subscribed === true,
      registeredAt: new Date(),
      lastOrderDate: null
    };
    customers.push(newCustomer);
    return NextResponse.json({ success: true, data: newCustomer, message: "Customer created successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ success: false, error: "Failed to create customer" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");
    const customerType = searchParams.get("customerType");
    const subscribed = searchParams.get("subscribed");
    const search = searchParams.get("search");
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") || "10", 10) || 10));

    let filteredCustomers = [...customers];
    if (country) filteredCustomers = filteredCustomers.filter((customer) => customer.country === country);
    if (customerType) filteredCustomers = filteredCustomers.filter((customer) => customer.customerType === customerType);
    if (subscribed !== null) filteredCustomers = filteredCustomers.filter((customer) => customer.subscribed === (subscribed === "true"));
    if (search) {
      const term = search.toLowerCase();
      filteredCustomers = filteredCustomers.filter((customer) =>
        customer.name.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        Boolean(customer.company?.toLowerCase().includes(term))
      );
    }
    filteredCustomers.sort((a, b) => b.registeredAt.getTime() - a.registeredAt.getTime());

    const startIndex = (page - 1) * limit;
    const data = filteredCustomers.slice(startIndex, startIndex + limit);
    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total: filteredCustomers.length, totalPages: Math.ceil(filteredCustomers.length / limit) }
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch customers" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { Customer } from '@/types';

// 模拟数据库存储
const customers: Customer[] = [];

// POST /api/customers - 创建新客户
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证必需字段
    const requiredFields = ['name', 'email', 'country'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // 检查邮箱是否已存在
    const existingCustomer = customers.find(c => c.email === body.email);
    if (existingCustomer) {
      return NextResponse.json(
        { success: false, error: 'Customer with this email already exists' },
        { status: 409 }
      );
    }

    // 创建新客户
    const newCustomer: Customer = {
      id: `customer-${Date.now()}`,
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      company: body.company || null,
      country: body.country,
      subscribed: body.subscribed || false,
      registeredAt: new Date(),
      lastOrderDate: null,
    };

    // 保存到模拟数据库
    customers.push(newCustomer);

    return NextResponse.json({
      success: true,
      data: newCustomer,
      message: 'Customer created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}

// GET /api/customers - 获取所有客户
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const customerType = searchParams.get('customerType');
    const subscribed = searchParams.get('subscribed');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let filteredCustomers: Customer[] = [...customers];

    // 按国家筛选
    if (country) {
      filteredCustomers = filteredCustomers.filter(customer => customer.country === country);
    }

    // 按客户类型筛选
    if (customerType) {
      filteredCustomers = filteredCustomers.filter(customer => customer.customerType === customerType);
    }

    // 按订阅状态筛选
    if (subscribed !== null) {
      const isSubscribed = subscribed === 'true';
      filteredCustomers = filteredCustomers.filter(customer => customer.subscribed === isSubscribed);
    }

    // 搜索功能
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredCustomers = filteredCustomers.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm) ||
        customer.email.toLowerCase().includes(searchTerm) ||
        (customer.company && customer.company.toLowerCase().includes(searchTerm))
      );
    }

    // 按注册日期排序（最新的在前）
    filteredCustomers.sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime());

    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: paginatedCustomers,
      pagination: {
        page,
        limit,
        total: filteredCustomers.length,
        totalPages: Math.ceil(filteredCustomers.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}


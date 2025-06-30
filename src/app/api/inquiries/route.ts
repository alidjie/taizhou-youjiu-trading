import { NextRequest, NextResponse } from 'next/server';
import { Inquiry } from '@/types';

// 模拟数据库存储
const inquiries: Inquiry[] = [];

// POST /api/inquiries - 提交询盘
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证必需字段
    const requiredFields = ['customerName', 'email', 'country', 'message'];
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

    // 创建新询盘
    const newInquiry: Inquiry = {
      id: `inquiry-${Date.now()}`,
      customerName: body.customerName,
      email: body.email,
      phone: body.phone || null,
      company: body.company || null,
      country: body.country,
      productId: body.productId || null,
      productName: body.productName || null,
      quantity: body.quantity || null,
      message: body.message,
      status: 'new',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 保存到模拟数据库
    inquiries.push(newInquiry);

    // 在实际应用中，这里应该：
    // 1. 保存到真实数据库
    // 2. 发送确认邮件给客户
    // 3. 发送通知邮件给销售团队

    return NextResponse.json({
      success: true,
      data: {
        id: newInquiry.id,
        message: 'Inquiry submitted successfully. We will contact you within 24 hours.'
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting inquiry:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit inquiry' },
      { status: 500 }
    );
  }
}

// GET /api/inquiries - 获取所有询盘（管理员功能）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let filteredInquiries: Inquiry[] = [...inquiries];

    // 按状态筛选
    if (status) {
      filteredInquiries = filteredInquiries.filter(inquiry => inquiry.status === status);
    }

    // 搜索功能
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredInquiries = filteredInquiries.filter(inquiry => 
        inquiry.customerName.toLowerCase().includes(searchTerm) ||
        inquiry.email.toLowerCase().includes(searchTerm) ||
        (inquiry.productName && inquiry.productName.toLowerCase().includes(searchTerm))
      );
    }

    // 按创建日期排序（最新的在前）
    filteredInquiries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedInquiries = filteredInquiries.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: paginatedInquiries,
      pagination: {
        page,
        limit,
        total: filteredInquiries.length,
        totalPages: Math.ceil(filteredInquiries.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inquiries' },
      { status: 500 }
    );
  }
}



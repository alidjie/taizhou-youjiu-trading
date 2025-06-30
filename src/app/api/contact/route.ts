import { NextRequest, NextResponse } from 'next/server';
import { ContactMessage } from '@/types';

// 模拟数据库存储
const contactMessages: ContactMessage[] = [];

// POST /api/contact - 提交联系表单
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证必需字段
    const requiredFields = ['firstName', 'lastName', 'email', 'subject', 'message'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // 验证邮箱格式
    const emailRegex = /^[\S+@\S+\.\S+]$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // 创建新联系消息
    const newMessage: ContactMessage = {
      id: `contact-${Date.now()}`,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone || null,
      company: body.company || null,
      subject: body.subject,
      message: body.message,
      newsletter: body.newsletter || false,
      status: 'new',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 保存到模拟数据库
    contactMessages.push(newMessage);

    // 在实际应用中，这里应该：
    // 1. 保存到真实数据库
    // 2. 发送确认邮件给客户
    // 3. 发送通知邮件给客服团队
    // 4. 如果选择了newsletter，添加到邮件列表

    return NextResponse.json({
      success: true,
      data: {
        id: newMessage.id,
        message: 'Message sent successfully. We will respond within 24 hours.'
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error sending contact message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// GET /api/contact - 获取所有联系消息（管理员功能）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const subject = searchParams.get('subject');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    let filteredMessages: ContactMessage[] = [...contactMessages];

    // 按状态筛选
    if (status) {
      filteredMessages = filteredMessages.filter(msg => msg.status === status);
    }

    // 按主题筛选
    if (subject) {
      filteredMessages = filteredMessages.filter(msg => msg.subject === subject);
    }

    // 分页
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedMessages = filteredMessages.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: paginatedMessages,
      pagination: {
        page,
        limit,
        total: filteredMessages.length,
        totalPages: Math.ceil(filteredMessages.length / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}



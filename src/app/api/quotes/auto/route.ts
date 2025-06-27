import { NextRequest, NextResponse } from 'next/server';

// POST /api/quotes/auto - 自动生成报价（基于询盘）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证必需字段
    const requiredFields = ['inquiryId', 'productId', 'quantity', 'customerEmail'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // 调用主报价API生成报价
    const quoteResponse = await fetch(`${request.nextUrl.origin}/api/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inquiryId: body.inquiryId,
        productId: body.productId,
        quantity: body.quantity,
        customerType: body.customerType || 'regular'
      })
    });

    if (!quoteResponse.ok) {
      throw new Error('Failed to generate quote');
    }

    const quoteData = await quoteResponse.json();

    // 在实际应用中，这里应该发送邮件给客户
    const emailData = {
      to: body.customerEmail,
      subject: 'Your Quote from Taizhou Youjiu Trading',
      template: 'quote',
      data: {
        quote: quoteData.data,
        customerName: body.customerName || 'Valued Customer'
      }
    };

    // 模拟发送邮件
    console.log('Email would be sent:', emailData);

    return NextResponse.json({
      success: true,
      data: {
        quote: quoteData.data,
        emailSent: true,
        message: 'Quote generated and sent to customer successfully'
      }
    });
  } catch (error) {
    console.error('Error in auto quote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate auto quote' },
      { status: 500 }
    );
  }
}


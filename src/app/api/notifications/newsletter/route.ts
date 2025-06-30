import { NextRequest, NextResponse } from 'next/server';

// POST /api/notifications/newsletter - 发送产品更新邮件
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证必需字段
    const requiredFields = ['products', 'subject'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const { products, subject, customMessage = '', targetCustomers = 'all' } = body;

    // 获取订阅客户列表
    const customersResponse = await fetch(`${request.nextUrl.origin}/api/customers?subscribed=true`);
    if (!customersResponse.ok) {
      throw new Error('Failed to fetch customers');
    }

    const customersData = await customersResponse.json();
    const subscribedCustomers = customersData.data || [];

    if (subscribedCustomers.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          emailsSent: 0,
          message: 'No subscribed customers found'
        }
      });
    }

    // 筛选目标客户
    let targetCustomerList = subscribedCustomers;
    if (targetCustomers === 'vip') {
      targetCustomerList = subscribedCustomers.filter((customer: any) => customer.customerType === 'vip');
    } else if (targetCustomers === 'wholesale') {
      targetCustomerList = subscribedCustomers.filter((customer: any) => customer.customerType === 'wholesale');
    }

    // 发送邮件给每个订阅客户
    const emailPromises = targetCustomerList.map(async (customer: any) => {
      try {
        const emailResponse = await fetch(`${request.nextUrl.origin}/api/notifications/email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: customer.email,
            subject,
            template: 'newsletter',
            data: {
              customerName: customer.name,
              products,
              customMessage
            }
          })
        });

        return {
          customer: customer.email,
          success: emailResponse.ok,
          error: emailResponse.ok ? null : await emailResponse.text()
        };
      } catch (error) {
        return {
          customer: customer.email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const emailResults = await Promise.all(emailPromises);
    const successCount = emailResults.filter(result => result.success).length;
    const failureCount = emailResults.filter(result => !result.success).length;

    return NextResponse.json({
      success: true,
      data: {
        totalCustomers: targetCustomerList.length,
        emailsSent: successCount,
        emailsFailed: failureCount,
        results: emailResults,
        message: `Newsletter sent to ${successCount} customers successfully`
      }
    });
  } catch (error) {
    console.error('Error sending newsletter:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send newsletter' },
      { status: 500 }
    );
  }
}


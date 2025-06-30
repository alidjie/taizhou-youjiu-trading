import { NextRequest, NextResponse } from 'next/server';

// POST /api/notifications/email - 发送邮件通知
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证必需字段
    const requiredFields = ['to', 'subject', 'template'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const { to, subject, template, data = {} } = body;

    // 邮件模板
    const emailTemplates = {
      inquiry_confirmation: {
        subject: 'Thank you for your inquiry - Taizhou Youjiu Trading',
        html: `
          <h2>Thank you for your inquiry!</h2>
          <p>Dear ${data.customerName || 'Valued Customer'},</p>
          <p>We have received your inquiry and our sales team will contact you within 24 hours.</p>
          <p><strong>Inquiry Details:</strong></p>
          <ul>
            <li>Product: ${data.productName || 'N/A'}</li>
            <li>Quantity: ${data.quantity || 'N/A'}</li>
            <li>Message: ${data.message || 'N/A'}</li>
          </ul>
          <p>Best regards,<br>Taizhou Youjiu Trading Team</p>
        `
      },
      quote: {
        subject: 'Your Quote from Taizhou Youjiu Trading',
        html: `
          <h2>Your Quote is Ready!</h2>
          <p>Dear ${data.customerName || 'Valued Customer'},</p>
          <p>Please find your quote details below:</p>
          <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
            <h3>Quote Details</h3>
            <p><strong>Quote ID:</strong> ${data.quote?.id || 'N/A'}</p>
            <p><strong>Product:</strong> ${data.quote?.productName || 'N/A'}</p>
            <p><strong>Quantity:</strong> ${data.quote?.quantity || 'N/A'}</p>
            <p><strong>Unit Price:</strong> $${data.quote?.unitPrice || 'N/A'}</p>
            <p><strong>Total Price:</strong> $${data.quote?.totalPrice || 'N/A'}</p>
            <p><strong>Valid Until:</strong> ${data.quote?.validUntil ? new Date(data.quote.validUntil).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Terms:</strong> ${data.quote?.terms || 'N/A'}</p>
          </div>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>Taizhou Youjiu Trading Team</p>
        `
      },
      order_confirmation: {
        subject: 'Order Confirmation - Taizhou Youjiu Trading',
        html: `
          <h2>Order Confirmation</h2>
          <p>Dear ${data.customerName || 'Valued Customer'},</p>
          <p>Your order has been confirmed. Here are the details:</p>
          <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> ${data.order?.id || 'N/A'}</p>
            <p><strong>Order Date:</strong> ${data.order?.orderDate ? new Date(data.order.orderDate).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Total Amount:</strong> $${data.order?.totalAmount || 'N/A'}</p>
            <p><strong>Status:</strong> ${data.order?.status || 'N/A'}</p>
          </div>
          <p>We will keep you updated on the progress of your order.</p>
          <p>Best regards,<br>Taizhou Youjiu Trading Team</p>
        `
      },
      shipping_update: {
        subject: 'Shipping Update - Your Order is on the Way!',
        html: `
          <h2>Shipping Update</h2>
          <p>Dear ${data.customerName || 'Valued Customer'},</p>
          <p>Great news! Your order has been shipped.</p>
          <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
            <h3>Shipping Details</h3>
            <p><strong>Order ID:</strong> ${data.order?.id || 'N/A'}</p>
            <p><strong>Tracking Number:</strong> ${data.order?.trackingNumber || 'N/A'}</p>
            <p><strong>Estimated Delivery:</strong> ${data.order?.estimatedDelivery ? new Date(data.order.estimatedDelivery).toLocaleDateString() : 'N/A'}</p>
          </div>
          <p>You can track your shipment using the tracking number provided above.</p>
          <p>Best regards,<br>Taizhou Youjiu Trading Team</p>
        `
      },
      newsletter: {
        subject: 'Latest Updates from Taizhou Youjiu Trading',
        html: `
          <h2>Newsletter</h2>
          <p>Dear ${data.customerName || 'Valued Customer'},</p>
          <p>Here are the latest updates from Taizhou Youjiu Trading:</p>
          <div style="border: 1px solid #ddd; padding: 20px; margin: 20px 0;">
            <h3>Product Updates</h3>
            ${data.products ? data.products.map((product: any) => `
              <div style="margin-bottom: 15px;">
                <h4>${product.name}</h4>
                <p>${product.description}</p>
                <p><strong>Price:</strong> $${product.price?.min} - $${product.price?.max}</p>
              </div>
            `).join('') : '<p>No product updates available.</p>'}
          </div>
          <p>Thank you for your continued trust in our products and services.</p>
          <p>Best regards,<br>Taizhou Youjiu Trading Team</p>
        `
      }
    };

    // 获取邮件模板
    const emailTemplate = emailTemplates[template as keyof typeof emailTemplates];
    if (!emailTemplate) {
      return NextResponse.json(
        { success: false, error: 'Invalid email template' },
        { status: 400 }
      );
    }

    // 在实际应用中，这里应该使用真实的邮件服务（如SendGrid, Resend等）
    const emailPayload = {
      to,
      subject: subject || emailTemplate.subject,
      html: emailTemplate.html,
      timestamp: new Date(),
      template,
      data
    };

    // 模拟发送邮件
    console.log('Email sent:', emailPayload);

    return NextResponse.json({
      success: true,
      data: {
        messageId: `msg-${Date.now()}`,
        to,
        subject: emailPayload.subject,
        template,
        sentAt: new Date()
      },
      message: 'Email sent successfully'
    });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send email' },
      { status: 500 }
    );
  }
}


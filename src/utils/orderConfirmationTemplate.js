export const orderConfirmationTemplate = ({
  orderId,
  appName,
  appUrl,
  userName,
  recipientType, // 'seller' or 'buyer'
  products,
  totalAmount
}) => {
  const productList = products
    .map(
      (product) =>
        `<li>${product.name} - Quantity: ${product.quantity} - Price: $${product.price}</li>`
    )
    .join('');

  return `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <h2 style="color: #4CAF50;">${appName} - Order Confirmation</h2>
      <p>Dear ${userName},</p>
      <p>Your ${recipientType === 'seller' ? 'product has been sold' : 'order has been placed'} successfully.</p>

      <h3>Order Details:</h3>
      <p><strong>Order ID:</strong> ${orderId}</p>
      <ul>${productList}</ul>
      <p><strong>Total Amount:</strong> $${totalAmount}</p>

      <p>You can view more details by logging into your account:</p>
      <a href="${appUrl}" style="color: #4CAF50;">Go to ${appName}</a>

      <p>Thank you for using ${appName}.</p>
    </div>
  `;
};

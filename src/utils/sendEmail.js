import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const resetPassword = async (to, name, otp) => {
  const text = `Dear ${name || 'Customer'},\n\nWe received a request to reset your password for your MarketToll account. Please use the following One-Time Password (OTP) to reset your password:\n\n${otp}\n\nIf you did not request a password reset, please ignore this email or contact our support team.\n\nThank you,\nThe MarketToll Team`;

  const html =
    `<!DOCTYPE html>
    <html>
<head>
  <style>
    .container {
      font-family: Arial, sans-serif;
      color: #333;
    }
    .header {
      background-color: #f4f4f4;
      padding: 20px;
      text-align: center;
    }
    .body {
      padding: 20px;
    }
    .otp {
      font-size: 24px;
      font-weight: bold;
      color: #d9534f;
    }
    .footer {
      margin-top: 20px;
      font-size: 12px;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MarketToll</h1>
    </div>
    <div class="body">
      <p>Dear ${name || 'Customer'},</p>
      <p>We received a request to reset your password for your MarketToll account. Please use the following One-Time Password (OTP) to reset your password:</p>
      <p class="otp">${otp}</p>
      <p>If you did not request a password reset, please ignore this email or contact our support team.</p>
      <p>Thank you,<br>The MarketToll Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2024 MarketToll. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  const msg = {
    from: {
      name: 'MarketToll',
      email: process.env.SENDGRID_EMAIL,
    },
    to: to,
    subject: 'MarketToll Password Reset Request',
    text: text,
    html: html
  };

  return await sgMail.send(msg);
};

export const verifyEmail = async (to, name, otp) => {
  const text = `Dear ${name || 'Customer'},\n\nThank you for registering with MarketToll. Please use the following One-Time Password (OTP) to verify your email address:\n\n${otp}\n\nIf you did not create an account, please ignore this email or contact our support team.\n\nThank you,\nThe MarketToll Team`;

  const html =
    `<!DOCTYPE html>
    <html>
<head>
  <style>
    .container {
      font-family: Arial, sans-serif;
      color: #333;
    }
    .header {
      background-color: #f4f4f4;
      padding: 20px;
      text-align: center;
    }
    .body {
      padding: 20px;
    }
    .otp {
      font-size: 24px;
      font-weight: bold;
      color: #5cb85c;
    }
    .footer {
      margin-top: 20px;
      font-size: 12px;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MarketToll</h1>
    </div>
    <div class="body">
      <p>Dear ${name || 'Customer'},</p>
      <p>Thank you for registering with MarketToll. Please use the following One-Time Password (OTP) to verify your email address:</p>
      <p class="otp">${otp}</p>
      <p>If you did not create an account, please ignore this email or contact our support team.</p>
      <p>Thank you,<br>The MarketToll Team</p>
    </div>
    <div class="footer">
      <p>&copy; 2024 MarketToll. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  const msg = {
    from: {
      name: 'MarketToll',
      email: process.env.SENDGRID_EMAIL,
    },
    to: to,
    subject: 'MarketToll Email Verification',
    text: text,
    html: html
  };

  return await sgMail.send(msg);
};

export const genericEmail = async (to, subject, text, name) => {
  const html =
    `<!DOCTYPE html>
    <html>
<head>
  <style>
    .container {
      font-family: Arial, sans-serif;
      color: #333;
    }
    .header {
      background-color: #f4f4f4;
      padding: 20px;
      text-align: center;
    }
    .body {
      padding: 20px;
    }
    .otp {
      font-size: 24px;
      font-weight: bold;
      color: #5cb85c;
    }
    .footer {
      margin-top: 20px;
      font-size: 12px;
      color: #777;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>MarketToll</h1>
    </div>
    <div class="body">
      <p>Dear ${name || 'Customer'},</p>
      <p>${text}</p>
    </div>
    <div class="footer">
      <p>&copy; 2024 MarketToll. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

  const msg = {
    from: {
      name: 'MarketToll',
      email: process.env.SENDGRID_EMAIL,
    },
    to,
    subject,
    text,
    html
  };

  return await sgMail.send(msg);
}; 

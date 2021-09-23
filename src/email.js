const { log } = require('./utils')
const nodemailer = require('nodemailer')

let transporter

function sendEmail (message) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_RECEIVER,
    subject: 'LUCKYDOG Update!',
    text: message + '\n' + process.env.TARGET_EMAIL_URL
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      log('Failed to send email', error);
    } else {
      log('Email sent:', info.response);
    }
  });
}

function initEmailService () {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

module.exports = { sendEmail, initEmailService }

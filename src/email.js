const nodemailer = require('nodemailer')

let transporter

function sendEmail (message) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_RECEIVER,
    subject: 'LUCKYDOG Update!',
    text: message + '\n' + process.env.TARGET_EMAIL_URL
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, function (error, info) {
      return error ? reject(error) : resolve(info.response)
    });
  })
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

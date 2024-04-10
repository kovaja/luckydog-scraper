const { processEvents } = require('./eventsController')
const { log } = require('./utils')
const { sendEmail, initEmailService } = require('./email')

async function check ({ shouldInitEmailService = true } = {}) {
  const { sendNotification, message } = await processEvents()
  let sentInfo = {
    message: 'No email sent',
    sendNotification,
    shouldInitEmailService
  }

  if (sendNotification && shouldInitEmailService) {
    initEmailService()
  }

  if (sendNotification) {
    log('Send notification', message)
    try {
      sentInfo = await sendEmail(message)
    } catch (e) {
      log('Send notification failed', e)
      sentInfo = e
    }
  }

  return { sendNotification, sentInfo };
}

module.exports = { check }

const { processEvents } = require('./eventsController')
const { log } = require('./utils')
const { sendEmail, initEmailService } = require('./email')

async function check ({ shouldInitEmailService = true } = {}) {
  const { sendNotification, message } = await processEvents()
  let sentInfo = ''

  if (sendNotification && shouldInitEmailService) {
    initEmailService()
  }

  if (sendNotification) {
    log('Send notification', message)
    try {
      sentInfo = await sendEmail()
    } catch (e) {
      sentInfo = e
    }
  }

  return { sendNotification, sentInfo };
}

module.exports = { check }

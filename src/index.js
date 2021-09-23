const express = require('express')
const { log, createHtml } = require('./utils')
const { processEvents, getReadableEvents, deleteEvents } = require('./eventsController')
const { sendEmail, initEmailService } = require('./email')

require('dotenv').config()

function createResponse (data) {
  return JSON.stringify({
    date: new Date().toISOString(),
    data: data || {}
  })
}

async function check (res) {
  const { sendNotification, message } = await processEvents()

  if (sendNotification) {
    log('Send notification', message)
    sendEmail(message)
  }

  res.send(createResponse({ sendNotification }))
}

function getEvents (res) {
  res.send(createHtml(getReadableEvents()))
}

function deleteAll (res) {
  deleteEvents()
  res.send(createResponse())
}

function status (res) {
  res.send(createResponse())
}

function handle (handler) {
  return async function (req, res) {
    log('New request', req.url)

    try {
      await handler(res)
    } catch (e) {
      log('Request handler failed', e)
      res.status(500).send(createResponse({ message: 'Request has failed' }))
    }
  }
}

async function main () {
  initEmailService()

  const app = express()
  const port = process.env.PORT

  app.get('/', handle(status))
  app.get('/check', handle(check))
  app.get('/events', handle(getEvents))
  app.get('/delete', handle(deleteAll))

  app.listen(port, () => {
    log(`App listening at ${port}`)
  })
}

main()

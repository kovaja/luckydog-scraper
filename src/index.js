const express = require('express')
const { log, createHtml } = require('./utils')
const { getReadableEvents, deleteEvents } = require('./eventsController')
const { initEmailService } = require('./email')
const { check } = require('./check')

require('dotenv').config()

function createResponse (data) {
  return JSON.stringify({
    date: new Date().toISOString(),
    data: data || {}
  })
}

async function _check(res) {
  res.send(
    createResponse(
      check({ shouldInitEmailService: false })
    )
  );
}

function getEvents (res) {
  res.send(createHtml(getReadableEvents()))
}

function deleteAll (res) {
  deleteEvents()
  res.send(createResponse())
}

function handleHome(req, res) {
  res.send(`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <title>HTML 5 Boilerplate</title>
    </head>
    <body>
      <div>Hello luckydog scraper</div>
    </body>
  </html>
  `)
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


  app.get('/', handleHome)
  app.get('/check', handle(_check))
  app.get('/events', handle(getEvents))
  app.get('/delete', handle(deleteAll))

  app.listen(port, () => {
    log(`App listening at ${port}`)
  })
}

main()

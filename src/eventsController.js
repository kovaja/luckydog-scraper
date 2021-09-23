const axios = require('axios')
const path = require('path')
const fs = require('fs')
const { log } = require('./utils')

function getUrl (date) {
  return `https://www.luckydog-vph.cz/wp-admin/admin-ajax.php?action=wpamelia_api&call=/events&dates[]=${date}&page=1&recurring=0`
}

async function getEvents () {
  try {
    const date = new Date().toISOString().split('T')[0]
    const url = getUrl(date)
    log(`Fetch data for ${date}: ${url}`)

    const response = await axios.get(url)
    const data = response.data.data
    log(`Got ${data.count} events`)

    return data.events
  } catch (e) {
    log('Field to load data', e)
    return []
  }
}

function getFilePath () {
  return path.resolve(__dirname, '../', 'events.json')
}

function getKnownEvents () {
  try {
    const filePath = getFilePath()
    if (!fs.existsSync(filePath)) {
      log('No events file')
      return []
    }

    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  } catch (e) {
    log('Failed to read existing events', e)
    return []
  }
}

function writeEvents (events) {
  try {
    fs.writeFileSync(getFilePath(), JSON.stringify(events, null, 2), 'utf-8')
    log(`Events successfully written`)
  } catch (e) {
    log('Failed to write events', e)
  }
}

function getAvailableEvents (events) {
  return events.filter(ev => ev.bookable)
}

function getEventIds (events) {
  return events.map(ev => ev.id)
}

function compareEvents (newEvents, knownEvents) {
  const knownIds = getEventIds(knownEvents)
  return getAvailableEvents(newEvents).filter((ev) => !knownIds.includes(ev.id))
}

function getDate (event) {
  const firstPeriod = event.periods[0] || {}
  const [date, startTime] = firstPeriod.periodStart?.split(' ') || []
  const readableTime = String(startTime).split(':').slice(0, 2).join(':')
  return `${date} ${readableTime}`
}

function getNewEventsMessage (events) {
  return ''
    + '\n--------------\n'
    + `Available LUCKYDOG events: ${events.length}\n`
    + `${events.map((ev) => `${getDate(ev)}: ${ev.name} - ${ev.places}/${ev.maxCapacity} | (id:${ev.id})`).join('\n')}`
    + '\n--------------\n'
}

async function processEvents () {
  const events = await getEvents()
  const knownEvents = getKnownEvents()
  const newlyAddedEvents = compareEvents(events, knownEvents)

  log(`There are ${newlyAddedEvents.length} new events`)

  if (newlyAddedEvents.length > 0) {
    writeEvents(newlyAddedEvents)
  }

  return {
    sendNotification: newlyAddedEvents.length > 0,
    message: getNewEventsMessage(newlyAddedEvents)
  }
}

function deleteEvents () {
  writeEvents([])
}

function getReadableEvents () {
  return getNewEventsMessage(getKnownEvents())
}

module.exports = { processEvents, getReadableEvents, deleteEvents }

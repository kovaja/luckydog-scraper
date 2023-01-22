const axios = require('axios')
const { log } = require('./utils')
const { readKnownEvents, writeEvents } = require('./db')

const DAY_MS = 24 * 60 * 60 * 1000
const UNWANTED_EVENTS_NAMES = [
  'Štěňátka a začátečníci',
  'Středeční školička pro',
  'Nosework s Ivetou'
]

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

function removeUnwantedEvents (eventsFromLuckyDog) {
  return eventsFromLuckyDog.filter((ev) => {
    return UNWANTED_EVENTS_NAMES.every(
      (unwantedPhrase) => !ev.name.includes(unwantedPhrase)
    )
  })
}

function getKnownEvents () {
  return readKnownEvents()
}

async function writeEventsToDb (events) {
  try {
    await writeEvents(JSON.stringify(events))
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

// newEvents may contain same events as knownEvents, but with changed properties
// we want to return an array where event.id is unique
function getUniqueEvents(knownEvents, newEvents) {
  const newEventsIds = getEventIds(newEvents)
  const knownEventsWithoutNewEvents = knownEvents.filter(ev => !newEventsIds.includes(ev.id))

  return [ ...newEvents, ...knownEventsWithoutNewEvents ]
}

function isInFuture({ periods }) {
  const todayTs = new Date().getTime();

  return periods?.some(p => {
    const periodTS = new Date(p.periodStart).getTime()
    if (isNaN(periodTS)) {
      return true // keep the event when we fail to parse the period time
    }

    // add 24 hours to prevent issues with different timezones
    return periodTS - todayTs + DAY_MS > 0
  })
}
// filter out events, that are full or that are from the past
function removeObsoleteEvents(availableEvents) {
  return availableEvents
    .filter(ev => ev.places > 0)
    .filter(isInFuture)
}

function getKnownEventById(knownEvents, id) {
  return knownEvents.find(ev => ev.id === id)
}

function isChangedEvent(knownEvents, event) {
  const eventWithSameId = getKnownEventById(knownEvents, event.id)
  // if we don't know this event, it's new, return true
  if (!eventWithSameId) {
    return true
  }

  // capacity of that event has changed, return true
  if (eventWithSameId.places !== event.places) {
    return true
  }

  // it's the same event, return false
  return false;
}

function compareEvents (newEvents, knownEvents) {
  return getAvailableEvents(newEvents)
    .filter((ev) => isChangedEvent(knownEvents, ev))
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
  const eventsFromLuckyDog = await getEvents()
  const events = removeUnwantedEvents(eventsFromLuckyDog)
  const knownEvents = await getKnownEvents()
  const newlyAddedOrChangedEvents = compareEvents(events, knownEvents)
  const uniqueEvents = getUniqueEvents(knownEvents, newlyAddedOrChangedEvents)
  const availableEvents = removeObsoleteEvents(uniqueEvents)

  const stats = {
    receivedAfterFilter: events.length,
    known: knownEvents.length,
    newOrChanged: newlyAddedOrChangedEvents.length,
    available: availableEvents.length
  }

  log(JSON.stringify(stats))
  if (newlyAddedOrChangedEvents.length > 0) {
    await writeEventsToDb(availableEvents)
  }

  return {
    sendNotification: newlyAddedOrChangedEvents.length > 0,
    message: getNewEventsMessage(availableEvents)
  }
}

function deleteEvents () {
  writeEvents([])
}

function getReadableEvents () {
  return getNewEventsMessage(getKnownEvents())
}

module.exports = { processEvents, getReadableEvents, deleteEvents }

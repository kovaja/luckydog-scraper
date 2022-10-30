const VERSION = '0.0.1'
function log (...args) {
  console.log(`LUCKY_DOG_SCRAPER[${VERSION}]: `, ...args)
}

function createHtml (content) {
  return `
    <!doctype html>
    <html>
      <head>
      <title>LuckyDogScraper</title>
      </head>
      <body>
        <pre>${content}</pre>
      </body>
    </html>
  `
}

module.exports = {
  log, createHtml
}

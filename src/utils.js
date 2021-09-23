function log(...args) {
  console.log('LUCKY_DOG_SCRAPER: ', ...args)
}

function createHtml(content) {
  return`
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

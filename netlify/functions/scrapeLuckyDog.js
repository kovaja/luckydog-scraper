const { check } = require('../../src/check')
const { log } = require('../../src/utils')

exports.handler = async function () {
  const start = new Date().getTime()
  let data = {}

  try {
    data = await check();
  } catch (e) {
    log('Netlify function failed', e);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: e })
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      data,
      time: new Date().getTime() - start
    })
  }
}

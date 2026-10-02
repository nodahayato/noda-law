const assert = require('assert')
const fs = require('fs')
const http = require('http')
const path = require('path')
const { validate } = require('./build-404')

const root = path.resolve(__dirname, '../public')
const expected = fs.readFileSync(path.join(root, '404.html'))
validate(expected.toString('utf8'))

let origin
function request(urlPath, method = 'GET', base = origin) {
  return new Promise((resolve, reject) => {
    const req = http.request(new URL(urlPath, base), { method }, res => {
      const chunks = []
      res.on('data', chunk => chunks.push(chunk))
      res.on('end', () => resolve({ status: res.statusCode,
        headers: res.headers, body: Buffer.concat(chunks) }))
    })
    req.setTimeout(10000, () => req.destroy(new Error('Hosting request timed out')))
    req.on('error', reject)
    req.end()
  })
}

async function main() {
  assert(process.env.FIREBASE_EMULATOR_HUB, 'Run using firebase emulators:exec')
  const hub = await request('/emulators', 'GET', `http://${process.env.FIREBASE_EMULATOR_HUB}`)
  assert.strictEqual(hub.status, 200)
  const hosting = JSON.parse(hub.body.toString('utf8')).hosting
  assert(hosting, 'Hosting emulator must be running')
  origin = `http://127.0.0.1:${hosting.port}`
  for (const url of ['/loc-117-missing', '/loc-117-missing/nested.php',
    '/loc-117-missing.js?scan=1']) {
    for (const method of ['GET', 'HEAD']) {
      const response = await request(url, method)
      assert.strictEqual(response.status, 404, `${method} ${url}`)
      assert.strictEqual(response.headers.location, undefined)
      assert.deepStrictEqual(response.body, method === 'GET' ? expected : Buffer.alloc(0))
      console.log(`${method} ${url}: 404, no redirect`)
    }
  }
  const article = '/刑事手続のIT化に関する若干の懸念/'
  for (const url of ['/', article, '/tags/', '/tags/it/', '/rss.xml']) {
    const response = await request(url)
    assert.strictEqual(response.status, 200, url)
    assert.deepStrictEqual(response.body, fs.readFileSync(path.join(root, url, url.endsWith('.xml') ? '' : 'index.html')))
    console.log(`GET ${url}: 200, matches generated HTML`)
  }
}

main().catch(error => { console.error(error); process.exitCode = 1 })

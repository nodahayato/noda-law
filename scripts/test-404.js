const assert = require('assert')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { validate, build404 } = require('./build-404')

const html = fs.readFileSync(path.join(__dirname, '../src/404.html'), 'utf8')
assert(validate(html) <= 2048)
const atLimit = html + ' '.repeat(2048 - Buffer.byteLength(html, 'utf8'))
assert.strictEqual(validate(atLimit), 2048)
assert.throws(() => validate(atLimit + ' '), /limit is 2048/)
for (const addition of [
  '<script src="/app.js"></script>', '<script>alert(1)</script>',
  '<img src="/photo.jpg">', '<link rel="stylesheet" href="/style.css">',
  '<link rel="preload" href="/font.woff2">',
  '<style>@import url(https://example.com/font.css);</style>',
  '<p style="background:url(/photo.jpg)">x</p>',
  '<body onload="alert(1)">', '<iframe src="/">',
  '<meta http-equiv="refresh" content="0;url=/">',
  '<svg><image href="/photo.jpg"></svg>', '<broken',
]) {
  assert.throws(() => validate(html.replace('</body>', addition + '</body>')),
    /unapproved markup/)
}
assert.throws(() => validate(html + 'あ'.repeat(683)), /limit is 2048/)
assert.throws(() => validate(html.replace('<a href="/">', '<a href="/other">')))

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'noda-law-404-'))
try {
  fs.mkdirSync(path.join(root, 'src'))
  fs.mkdirSync(path.join(root, 'public'))
  fs.writeFileSync(path.join(root, 'src/404.html'), html)
  fs.writeFileSync(path.join(root, 'public/404.html'), '<script>old Gatsby HTML</script>')
  fs.writeFileSync(path.join(root, 'public/index.html'), 'home sentinel')
  fs.mkdirSync(path.join(root, 'public/article'))
  fs.writeFileSync(path.join(root, 'public/article/index.html'), 'article sentinel')
  build404(root)
  assert.strictEqual(fs.readFileSync(path.join(root, 'public/404.html'), 'utf8'), html)
  assert.strictEqual(fs.readFileSync(path.join(root, 'public/index.html'), 'utf8'), 'home sentinel')
  assert.strictEqual(fs.readFileSync(path.join(root, 'public/article/index.html'), 'utf8'), 'article sentinel')
  fs.writeFileSync(path.join(root, 'src/404.html'), html + '<script src="/app.js"></script>')
  assert.throws(() => build404(root), /unapproved markup/)
  assert.strictEqual(fs.readFileSync(path.join(root, 'public/404.html'), 'utf8'), html)
} finally {
  fs.rmSync(root, { recursive: true, force: true })
}
console.log('404 regression checks passed')

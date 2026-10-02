const fs = require('fs')
const path = require('path')

const maxBytes = 2048
// Deliberately narrow: new elements/attributes need review. In particular,
// scripts, styles, resource URLs, refresh, event handlers and SVG are rejected.
const allowedTags = new Set([
  '<!doctype html>', '<html lang="ja">', '</html>',
  '<head>', '</head>', '<meta charset="utf-8">',
  '<meta name="viewport" content="width=device-width, initial-scale=1">',
  '<link rel="icon" href="data:,">',
  '<title>', '</title>', '<body>', '</body>', '<main>', '</main>',
  '<h1>', '</h1>', '<p>', '</p>', '<a href="/">', '</a>',
])

function validate(html) {
  const bytes = Buffer.byteLength(html, 'utf8')
  if (bytes > maxBytes) {
    throw new Error(`404 HTML is ${bytes} bytes; limit is ${maxBytes}`)
  }
  // Split at every '<', including malformed markup, to fail closed.
  for (const part of html.split('<').slice(1)) {
    const tag = '<' + part.slice(0, part.indexOf('>') + 1)
    if (!allowedTags.has(tag)) {
      throw new Error(`404 HTML contains unapproved markup: ${tag}`)
    }
  }
  for (const required of ['<!doctype html>', '<html lang="ja">',
    '<meta charset="utf-8">', '<link rel="icon" href="data:,">',
    '<a href="/">', '</html>']) {
    if (!html.includes(required)) throw new Error(`404 HTML requires ${required}`)
  }
  return bytes
}

function build404(root = path.resolve(__dirname, '..')) {
  const html = fs.readFileSync(path.join(root, 'src/404.html'), 'utf8')
  validate(html)
  // Gatsby must have completed first; do not create an otherwise empty public/.
  const output = path.join(root, 'public/404.html')
  fs.writeFileSync(output, html)
  const bytes = validate(fs.readFileSync(output, 'utf8'))
  console.log(`Standalone 404: ${bytes}/${maxBytes} bytes`)
}

if (require.main === module) build404()
module.exports = { validate, build404 }

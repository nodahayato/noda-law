"""Smoke-check real Gatsby output, including RSS XML and local asset references."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit
from email.utils import parsedate_to_datetime
import xml.etree.ElementTree as ET

root = Path(__file__).resolve().parent.parent / 'public'
title = '刑事手続のIT化に関する若干の懸念'

class Page(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.text = []
        self.refs = []
        self.links = []
        self.feed(html)

    def handle_data(self, data):
        self.text.append(data)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a' and 'href' in attrs:
            self.links.append(unquote(urlsplit(attrs['href']).path))
        if tag in ('script', 'img') and 'src' in attrs:
            self.refs.append(attrs['src'])
        if tag == 'link' and attrs.get('rel') in ('stylesheet', 'preload'):
            self.refs.append(attrs['href'])

for route in ['/', f'/{title}/', '/tags/', '/tags/it/', '/tags/刑事訴訟法/', '/tags/立法論/']:
    file = root / route.lstrip('/') / 'index.html'
    page = Page(file.read_text())
    text = ''.join(page.text)
    assert title in text or route == '/tags/', route
    if route == f'/{title}/':
        assert '議論の現状' in text and '自動化が引き起こすもの' in text, route
    else:
        assert f'/{title}/' in page.links or route == '/tags/', route
    for ref in page.refs:
        url = urlsplit(ref)
        if not url.scheme and not url.netloc and url.path.startswith('/'):
            assert (root / unquote(url.path).lstrip('/')).is_file(), (route, ref)
    print(f'{route}: generated HTML, content and local assets OK ({file.stat().st_size} bytes)')

channel = ET.parse(root / 'rss.xml').getroot().find('channel')
assert channel is not None
assert channel.findtext('title') == '研究ノート RSS'
items = channel.findall('item')
item = next(item for item in items if item.findtext('title') == title)
assert unquote(item.findtext('link')) == f'https://noda.law/{title}/'
assert item.findtext('guid') == item.findtext('link')
assert parsedate_to_datetime(item.findtext('pubDate')).year == 2021
assert '議論の現状' in item.findtext('{http://purl.org/rss/1.0/modules/content/}encoded')
print(f'RSS: valid XML, {len(items)} item(s), title/link/date/full content OK')

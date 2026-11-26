function appendInline(parent, text) {
  for (const part of text.split(/(\*\*[^*\n]+\*\*)/g)) {
    if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) {
      const strong = document.createElement('strong');
      strong.textContent = part.slice(2, -2);
      parent.append(strong);
    } else {
      parent.append(part);
    }
  }
}

export function renderNewsBody(parent, text, format) {
  const paragraphs = String(text || '').split(/\n{2,}/).filter(Boolean);
  for (const paragraph of paragraphs) {
    if (format !== 'markdown-basic') {
      const p = document.createElement('p');
      p.textContent = paragraph;
      parent.append(p);
      continue;
    }
    let block;
    for (const line of paragraph.split('\n')) {
      const heading = line.startsWith('## ');
      const bullet = line.startsWith('- ');
      const tag = heading ? 'h3' : bullet ? 'ul' : 'p';
      if (heading || block?.localName !== tag) {
        block = document.createElement(tag);
        parent.append(block);
      } else if (!bullet) {
        block.append(document.createElement('br'));
      }
      const item = bullet ? document.createElement('li') : block;
      if (bullet) block.append(item);
      appendInline(item, line.slice(heading ? 3 : bullet ? 2 : 0));
    }
  }
}

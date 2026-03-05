const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const blogDir = path.join(__dirname, '..', 'public', 'assets', 'blog');
    const outFile = path.join(blogDir, 'index.json');

    const files = await fs.promises.readdir(blogDir);
    const mdFiles = files.filter((f) => f.endsWith('.md'));

    const posts = [];

    for (const filename of mdFiles) {
      const filePath = path.join(blogDir, filename);
      const content = await fs.promises.readFile(filePath, 'utf8');

      // Remove BOM
      const clean = content.replace(/^\uFEFF/, '');

      // Extract front-matter if present
      const fmMatch = clean.match(/^---[\s\S]*?---[\r\n]*/);
      let meta = {};
      let body = clean;
      if (fmMatch) {
        const yamlBlock = fmMatch[0];
        body = clean.slice(fmMatch[0].length);
        const yaml = yamlBlock.replace(/^---[\r\n]?|[\r\n]?$|---[\r\n]?/g, '').trim();
        // crude parsing key: value lines
        yaml.split(/\r?\n/).forEach((line) => {
          const m = line.match(/^([a-zA-Z0-9_\-]+):\s*(.*)$/);
          if (m) {
            const key = m[1];
            let val = m[2].trim();
            // handle arrays like tags: [a, b]
            if (val.startsWith('[') && val.endsWith(']')) {
              val = val
                .slice(1, -1)
                .split(',')
                .map((t) => t.trim().replace(/^['\"]|['\"]$/g, ''))
                .filter(Boolean);
            } else {
              // strip surrounding quotes for scalar values
              val = val.replace(/^['\"]|['\"]$/g, '');
            }
            meta[key] = val;
          }
        });
      }

      // derive title and excerpt
      const title = meta.title || (() => {
        const m = body.match(/^#\s+(.+)$/m);
        return m ? m[1].trim() : path.basename(filename, '.md');
      })();

      const excerpt = meta.excerpt || '';

      const date = meta.date || null;
      const cover = meta.cover || null;
      const tags = meta.tags || [];

      posts.push({
        title,
        date,
        excerpt,
        path: `assets/blog/${filename}`,
        coverImage: cover,
        tags,
      });
    }

    const out = { posts };
    await fs.promises.writeFile(outFile, JSON.stringify(out, null, 2), 'utf8');
    console.log('Generated', outFile);
  } catch (err) {
    console.error('Failed to generate blog index:', err);
    process.exit(1);
  }
})();

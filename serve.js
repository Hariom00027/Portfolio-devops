// Minimal static server for local preview: node serve.js
const http = require("http"), fs = require("fs"), path = require("path");
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".xml": "application/xml", ".txt": "text/plain", ".webmanifest": "application/manifest+json" };
const root = __dirname, port = process.env.PORT || 5173;
http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
  if (!p.startsWith(root)) return res.writeHead(403).end();
  fs.readFile(p, (err, data) => {
    if (err) return res.writeHead(404).end("not found");
    res.writeHead(200, { "Content-Type": types[path.extname(p)] || "application/octet-stream", "Cache-Control": "no-cache" }).end(data);
  });
}).listen(port, () => console.log(`portfolio on http://localhost:${port}`));

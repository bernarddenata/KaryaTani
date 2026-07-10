import { NextResponse } from 'next/server'

// TODO: Protect this endpoint in production (e.g., require auth or restrict by environment)
export async function GET() {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Karya Tani Center - API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/openapi.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: "BaseLayout"
    })
  </script>
</body>
</html>`
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
}

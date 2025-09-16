const fs = require("fs");
const path = require("path");

// Read swagger.json
const swaggerPath = path.join(__dirname, "swagger.json");
const swaggerSpec = JSON.parse(fs.readFileSync(swaggerPath, "utf-8"));

// Generate swagger.html
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Swagger UI - Bundled</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const spec = ${JSON.stringify(swaggerSpec, null, 2)};
      const ui = SwaggerUIBundle({
        spec: spec,
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
      window.ui = ui;
    };
  </script>
</body>
</html>`;

const outputPath = path.join(__dirname, "swagger.html");
fs.writeFileSync(outputPath, html, "utf-8");
console.log("✅ swagger.html generated successfully.");

const swaggerJSDoc = require('swagger-jsdoc');
const fs = require('fs');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CollabMate API Docs',
      version: '1.2.0',
    },
  },
  apis: ['../routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);
fs.writeFileSync('./swagger.json', JSON.stringify(swaggerSpec, null, 2));
console.log('✅ swagger.json generated successfully.');
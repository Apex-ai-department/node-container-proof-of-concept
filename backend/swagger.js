import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

// swagger setup
// http://<app_host>:<app_port>/api-docs
const swaggerOptions = {
    swaggerDefinition: {
      myapi: '3.0.0',
      info: {
        title: 'Node Container API',
        version: '1.0.0',
        description: 'Express Backend API documentation',
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Development Server',
        },
      ],
    },
    apis: ['./routes/*.js', './server.js'], 
  };
  
  const specs = swaggerJsdoc(swaggerOptions);

  export { specs, swaggerUi };
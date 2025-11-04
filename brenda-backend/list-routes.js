const express = require('express');

// Create a mock app to list routes
const app = express();

// Import routes
const adminRoutes = require('./src/routes/admin.ts');

// Mount admin routes
app.use('/api/admin', adminRoutes);

// List all routes
function listRoutes() {
  const routes = [];
  
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Route middleware
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      // Router middleware
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const path = middleware.regexp.source
            .replace('\\/?', '')
            .replace('(?=\\/|$)', '')
            .replace(/\\\//g, '/');
          routes.push({
            path: `${path}${handler.route.path}`,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  
  return routes;
}

console.log('Registered routes:');
console.log(JSON.stringify(listRoutes(), null, 2));

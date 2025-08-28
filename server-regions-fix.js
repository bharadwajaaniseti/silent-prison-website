// Add these routes to your server.js file, replacing the existing regions routes

// Import the regions handler
import regionsHandler from './api/regions.js';

// Regions routes - order matters for proper matching
app.post('/api/regions/bulk', (req, res) => {
  req.url = '/api/regions/bulk';
  regionsHandler(req, res);
});

app.get('/api/regions/user-type/:userType', (req, res) => {
  req.url = `/api/regions/user-type/${req.params.userType}`;
  regionsHandler(req, res);
});

app.put('/api/regions/:id/visibility', (req, res) => {
  req.url = `/api/regions/${req.params.id}/visibility`;
  regionsHandler(req, res);
});

app.delete('/api/regions/:id', (req, res) => {
  req.url = `/api/regions/${req.params.id}`;
  regionsHandler(req, res);
});

app.put('/api/regions/:id', (req, res) => {
  req.url = `/api/regions/${req.params.id}`;
  regionsHandler(req, res);
});

app.all('/api/regions', (req, res) => regionsHandler(req, res));
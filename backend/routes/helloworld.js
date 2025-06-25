app.get('/api/user', (req, res) => {
  res.json([{ id: 1, name: 'John Doe' }]);
});

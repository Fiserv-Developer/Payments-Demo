const http = require('http');
const app = require('./app')
const port = process.env.PORT || 3124;
const httpServer = http.createServer(app);
httpServer.listen(port, () => {
    console.log(`\n API: Server started ! ✅ (Port ${port})\n`);
});
  
  
  
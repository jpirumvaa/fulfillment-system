import app from "./app";
import { config } from "dotenv";
import { DbConnection } from "./database/index";
import { Logger } from "./utils/logger";
import "reflect-metadata";

config();
const PORT = process.env.PORT ?? 5000;

(async () => {
  try {
    await DbConnection.instance.initializeDb();
    Logger.instance.log("DB Connected");
  } catch (error) {
    Logger.instance.error(JSON.stringify(error));
  }
  
  const server = app.listen(PORT, () => console.log(`App is up and listening to ${PORT}`));

  // Graceful shutdown handlers
  const cleanup = async () => {
    console.log('Shutting down gracefully...');
    
    // Close server
    server.close(() => {
      console.log('HTTP server closed.');
    });
    
    // Close logger streams
    Logger.instance.cleanup();
    
    // Close database connection
    try {
      await DbConnection.instance.disconnectDb();
      console.log('Database disconnected.');
    } catch (error) {
      console.error('Error disconnecting database:', error);
    }
    
    process.exit(0);
  };

  // Handle different shutdown signals
  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
  process.on('SIGUSR2', cleanup); // nodemon restart
})();

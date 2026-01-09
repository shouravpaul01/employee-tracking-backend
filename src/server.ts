import { createServer } from "http";
import app from "./app";
import config from "./config";
// import "./helpars/redis";
import { initializeCronJobs } from "./jobs";
import { initializeSocket } from "./helpers/socket";
// import cron from "node-cron";
const httpServer = createServer(app);
initializeSocket(httpServer);
// Main function to start the server
function main() {
  const server = httpServer.listen(Number(config.port), () => {
    console.log(
      "Server is running on port ==>",
      `http://localhost:${config.port}`
    );

    // initializeCronJobs();
  });

  // Graceful shutdown function
  const exitHandler = () => {
    if (server) {
      server.close(() => {
        console.log("Server closed");
      });
    }
    process.exit(1);
  };

  // Handle uncaught exceptions and unhandled promise rejections
  process.on("uncaughtException", exitHandler);
  process.on("unhandledRejection", exitHandler);
}

// Start the server
main();

export default app;

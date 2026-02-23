import { createServer } from "http";
import app from "./app";
import config from "./config";
import { initializeSocket } from "./helpers/socket";
import { initiateSuperAdmin } from "./app/db/db";

const httpServer = createServer(app);
initializeSocket(httpServer);

function main() {
  const port = Number(config.port) || 5000;

  const server = httpServer.listen(port, () => {
    console.log(`🚀 Server is running on ==> http://localhost:${port}`);
    initiateSuperAdmin();
  });

  /**
    Handle unexpected errors WITHOUT killing dev server instantly
   */

  process.on("uncaughtException", (err) => {
    console.error(" UNCAUGHT EXCEPTION:", err);
  });

  process.on("unhandledRejection", (err) => {
    console.error(" UNHANDLED REJECTION:", err);
  });

  /**
   *  Graceful shutdown (Ctrl + C / server stop)
   */
  const shutdown = () => {
    console.log("🛑 Shutting down server...");

    server.close(() => {
      console.log(" Server closed successfully");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);  // Ctrl + C
  process.on("SIGTERM", shutdown); // deployment stop
}

main();

export default app;
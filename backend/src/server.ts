
import "dotenv/config";
import app from "./app";
import { connectDB } from "./config/db";

async function startServer(): Promise<void> {
  try {
    await connectDB();

    const port = Number(process.env.PORT) || 5000;

    app.listen(port, "0.0.0.0", () => {
      console.log(`To-Do API listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

void startServer();
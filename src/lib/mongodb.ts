/* eslint-disable @typescript-eslint/no-explicit-any */
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import net from "net";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/platform-db";

// -----------------------------------------------------------------------------
// GRACEFUL MOCK MONGODB CLIENT FALLBACK FOR ENVIRONMENTS WITHOUT RUNNING MONGO
// -----------------------------------------------------------------------------
class MockCollection {
  name: string;
  dbName: string;
  constructor(name: string, dbName: string) {
    this.name = name;
    this.dbName = dbName;
  }

  _getFilePath() {
    const dir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return path.join(dir, `mock_db_${this.dbName}_${this.name}.json`);
  }

  _read(): any[] {
    const filePath = this._getFilePath();
    if (fs.existsSync(filePath)) {
      try {
        return JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch {
        return [];
      }
    }
    return [];
  }

  _write(data: any[]) {
    const filePath = this._getFilePath();
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  }

  find(query: any = {}) {
    const data = this._read();
    const filtered = data.filter((item: any) => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
    return {
      toArray: async () => filtered,
    };
  }

  async findOne(query: any = {}) {
    const data = this._read();
    const found = data.find((item: any) => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
    return found || null;
  }

  async updateOne(query: any, update: any, options: any = {}) {
    const data = this._read();
    const setDoc = update.$set || {};

    const index = data.findIndex((item: any) => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });

    if (index !== -1) {
      data[index] = { ...data[index], ...setDoc };
    } else if (options.upsert) {
      data.push({ ...query, ...setDoc });
    }
    this._write(data);
    return { modifiedCount: index !== -1 ? 1 : 0, upsertedCount: index === -1 ? 1 : 0 };
  }

  async deleteOne(query: any) {
    const data = this._read();
    const index = data.findIndex((item: any) => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });

    if (index !== -1) {
      data.splice(index, 1);
      this._write(data);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }

  async deleteMany(query: any = {}) {
    const data = this._read();
    const initialLength = data.length;
    const remaining = data.filter((item: any) => {
      for (const key in query) {
        if (item[key] === query[key]) return false;
      }
      return true;
    });

    this._write(remaining);
    return { deletedCount: initialLength - remaining.length };
  }

  async insertMany(docs: any[]) {
    if (!Array.isArray(docs) || docs.length === 0) {
      return { insertedCount: 0 };
    }
    const data = this._read();
    data.push(...docs);
    this._write(data);
    return { insertedCount: docs.length };
  }
}

class MockDb {
  databaseName: string;
  constructor(name: string) {
    this.databaseName = name;
  }
  collection(name: string) {
    return new MockCollection(name, this.databaseName);
  }
}

class MockMongoClient {
  async connect() {
    return this;
  }
  db(name: string) {
    return new MockDb(name);
  }
}

// Helper to check if MongoDB port is listening via TCP socket
function checkMongoRunning(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(800);

    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });

    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });

    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    let port = 27017;
    let host = "127.0.0.1";
    try {
      const cleanUri = uri.replace("mongodb://", "");
      const hostPortPart = cleanUri.split("/")[0];
      if (hostPortPart.includes(":")) {
        const parts = hostPortPart.split(":");
        host = parts[0];
        port = parseInt(parts[1]);
      } else {
        host = hostPortPart;
      }
    } catch {
      // Default fallback
    }

    socket.connect(port, host);
  });
}

// -----------------------------------------------------------------------------
// CONNECTION MANAGER WITH AUTOMATIC MOCK ON FAILURE
// -----------------------------------------------------------------------------
let clientPromise: Promise<any>;

const options = {
  connectTimeoutMS: 1500,
  serverSelectionTimeoutMS: 1500,
};

async function createClientPromise(): Promise<any> {
  const isLocalHost = uri.includes("localhost") || uri.includes("127.0.0.1");

  if (isLocalHost) {
    const isRunning = await checkMongoRunning();
    if (!isRunning) {
      console.warn(
        "⚠️ Local MongoDB server is not running. Falling back to Mock DB Storage..."
      );
      return new MockMongoClient();
    }
  }

  try {
    const client = new MongoClient(uri, options);
    await client.connect();
    console.log("Successfully connected to MongoDB server.");
    return client;
  } catch (error) {
    if (isLocalHost) {
      console.warn(
        "⚠️ Could not connect to local MongoDB server. Falling back to Mock DB Storage..."
      );
      return new MockMongoClient();
    } else {
      throw error;
    }
  }
}

if (process.env.NODE_ENV === "development") {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<any>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoClientPromise = createClientPromise();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  clientPromise = createClientPromise();
}

export default clientPromise;

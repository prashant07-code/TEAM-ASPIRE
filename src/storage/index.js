import { config } from "../config/env.js";
import { FileComplaintStorage } from "./fileStorage.js";

let storageInstance;

export async function getStorage() {
  if (!storageInstance) {
    if (config.storage.engine === "mongo" && config.storage.mongodbUri) {
      const { MongoComplaintStorage } = await import("./mongoStorage.js");
      storageInstance = new MongoComplaintStorage(config.storage.mongodbUri);
    } else {
      storageInstance = new FileComplaintStorage(config.storage.filePath);
    }

    await storageInstance.init();
  }

  return storageInstance;
}

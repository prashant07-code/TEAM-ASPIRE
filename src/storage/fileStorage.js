import fs from "node:fs/promises";
import path from "node:path";

import { buildSummary } from "../utils/analytics.js";

export class FileComplaintStorage {
  constructor(filePath) {
    this.filePath = path.resolve(filePath);
  }

  async init() {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });

    try {
      await fs.access(this.filePath);
    } catch {
      await fs.writeFile(this.filePath, "[]\n", "utf8");
    }
  }

  async #readAll() {
    await this.init();
    const content = await fs.readFile(this.filePath, "utf8");
    return JSON.parse(content || "[]");
  }

  async #writeAll(records) {
    await fs.writeFile(this.filePath, `${JSON.stringify(records, null, 2)}\n`, "utf8");
  }

  async create(record) {
    const records = await this.#readAll();
    records.unshift(record);
    await this.#writeAll(records);
    return record;
  }

  async list({ limit = 100 } = {}) {
    const records = await this.#readAll();
    return records
      .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
      .slice(0, limit);
  }

  async getByTrackingId(trackingId) {
    const records = await this.#readAll();
    return records.find((record) => record.trackingId === trackingId) || null;
  }

  async updateStatus(trackingId, status) {
    const records = await this.#readAll();
    const target = records.find((record) => record.trackingId === trackingId);

    if (!target) {
      return null;
    }

    target.status = status;
    target.updatedAt = new Date().toISOString();
    await this.#writeAll(records);
    return target;
  }

  async getSummary() {
    const records = await this.#readAll();
    return buildSummary(records);
  }
}

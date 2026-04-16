import { buildSummary } from "../utils/analytics.js";

function normalizeDocument(document) {
  const output = document.toObject ? document.toObject() : document;
  delete output._id;
  return output;
}

export class MongoComplaintStorage {
  constructor(mongodbUri) {
    this.mongodbUri = mongodbUri;
    this.mongoose = null;
    this.ComplaintModel = null;
  }

  async init() {
    if (!this.mongoose) {
      const mongooseModule = await import("mongoose");
      this.mongoose = mongooseModule.default;
    }

    if (!this.ComplaintModel) {
      const complaintSchema = new this.mongoose.Schema(
        {
          trackingId: { type: String, required: true, unique: true },
          citizenName: String,
          phoneNumber: String,
          area: String,
          transcript: String,
          description: String,
          category: {
            slug: String,
            label: String,
            department: String
          },
          classification: this.mongoose.Schema.Types.Mixed,
          languageCode: String,
          status: String,
          location: {
            latitude: Number,
            longitude: Number,
            accuracy: Number,
            address: String,
            source: String
          },
          transcription: this.mongoose.Schema.Types.Mixed,
          createdAt: String,
          updatedAt: String
        },
        {
          versionKey: false
        }
      );

      this.ComplaintModel =
        this.mongoose.models.Complaint ||
        this.mongoose.model("Complaint", complaintSchema);
    }

    if (this.mongoose.connection.readyState === 0) {
      await this.mongoose.connect(this.mongodbUri);
    }
  }

  async create(record) {
    await this.init();
    const complaint = await this.ComplaintModel.create(record);
    return normalizeDocument(complaint);
  }

  async list({ limit = 100 } = {}) {
    await this.init();
    const records = await this.ComplaintModel.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return records.map(normalizeDocument);
  }

  async getByTrackingId(trackingId) {
    await this.init();
    const complaint = await this.ComplaintModel.findOne({ trackingId }).lean();
    return complaint ? normalizeDocument(complaint) : null;
  }

  async updateStatus(trackingId, status) {
    await this.init();
    const complaint = await this.ComplaintModel.findOneAndUpdate(
      { trackingId },
      { status, updatedAt: new Date().toISOString() },
      { new: true }
    ).lean();

    return complaint ? normalizeDocument(complaint) : null;
  }

  async getSummary() {
    await this.init();
    const records = await this.ComplaintModel.find({}).lean();
    return buildSummary(records.map(normalizeDocument));
  }
}

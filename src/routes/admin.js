import express from "express";

import { complaintStatuses } from "../data/categories.js";

export function createAdminRouter({ storage }) {
  const router = express.Router();

  router.get("/summary", async (_request, response, next) => {
    try {
      response.json(await storage.getSummary());
    } catch (error) {
      next(error);
    }
  });

  router.get("/complaints", async (request, response, next) => {
    try {
      const limit = Number(request.query.limit || 100);
      const complaints = await storage.list({ limit });
      response.json({ complaints });
    } catch (error) {
      next(error);
    }
  });

  router.patch("/complaints/:trackingId/status", async (request, response, next) => {
    try {
      const nextStatus = String(request.body?.status || "").trim();

      if (!complaintStatuses.includes(nextStatus)) {
        return response.status(400).json({
          error: "Invalid complaint status."
        });
      }

      const updatedComplaint = await storage.updateStatus(
        request.params.trackingId,
        nextStatus
      );

      if (!updatedComplaint) {
        return response.status(404).json({
          error: "Complaint not found."
        });
      }

      response.json({ complaint: updatedComplaint });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

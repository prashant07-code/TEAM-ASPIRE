const statusValues = ["Submitted", "Under Review", "Field Assigned", "Resolved"];

const elements = {
  statsGrid: document.querySelector("#statsGrid"),
  statusBreakdown: document.querySelector("#statusBreakdown"),
  categoryBreakdown: document.querySelector("#categoryBreakdown"),
  complaintsBody: document.querySelector("#complaintsBody"),
  tableMessage: document.querySelector("#tableMessage")
};

function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function renderStats(summary) {
  const cards = [
    { label: "Total complaints", value: summary.totalComplaints ?? 0 },
    { label: "Open complaints", value: summary.openComplaints ?? 0 },
    { label: "Submitted today", value: summary.submittedToday ?? 0 },
    { label: "Resolved today", value: summary.resolvedToday ?? 0 }
  ];

  elements.statsGrid.innerHTML = cards
    .map(
      (card) => `
        <article class="stat-card">
          <span>${card.label}</span>
          <strong>${card.value}</strong>
        </article>
      `
    )
    .join("");
}

function renderBreakdown(container, items) {
  const maxValue = Math.max(1, ...items.map((item) => item.count));

  container.innerHTML = items
    .map(
      (item) => `
        <article class="breakdown-item">
          <header>
            <span>${item.label}</span>
            <span>${item.count}</span>
          </header>
          <div class="bar">
            <div class="bar-fill" style="width: ${(item.count / maxValue) * 100}%"></div>
          </div>
        </article>
      `
    )
    .join("");
}

async function updateStatus(trackingId, status) {
  const response = await fetch(`/api/admin/complaints/${trackingId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status })
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Failed to update complaint status.");
  }

  return payload.complaint;
}

function renderComplaints(complaints) {
  if (!complaints.length) {
    elements.tableMessage.textContent = "No complaints filed yet.";
    elements.complaintsBody.innerHTML = "";
    return;
  }

  elements.tableMessage.textContent = `${complaints.length} complaints loaded.`;
  elements.complaintsBody.innerHTML = complaints
    .map(
      (complaint) => `
        <tr>
          <td><span class="tracking-chip">${complaint.trackingId}</span></td>
          <td>
            <strong>${complaint.citizenName || "Anonymous"}</strong><br />
            <span>${complaint.phoneNumber || "-"}</span>
          </td>
          <td>
            <strong>${complaint.category?.label || "Other"}</strong><br />
            <span>${complaint.category?.department || "-"}</span>
          </td>
          <td>
            <strong>${complaint.area || complaint.location?.address || "-"}</strong><br />
            <span>${
              complaint.location?.latitude
                ? `${complaint.location.latitude.toFixed(4)}, ${complaint.location.longitude.toFixed(4)}`
                : "Coordinates unavailable"
            }</span>
          </td>
          <td>${complaint.description || complaint.transcript || "-"}</td>
          <td>
            <select class="status-select" data-tracking-id="${complaint.trackingId}">
              ${statusValues
                .map(
                  (status) =>
                    `<option value="${status}" ${
                      complaint.status === status ? "selected" : ""
                    }>${status}</option>`
                )
                .join("")}
            </select>
          </td>
          <td>${formatDate(complaint.createdAt)}</td>
        </tr>
      `
    )
    .join("");

  document.querySelectorAll(".status-select").forEach((select) => {
    select.addEventListener("change", async (event) => {
      const trackingId = event.target.dataset.trackingId;
      const nextStatus = event.target.value;
      elements.tableMessage.textContent = `Updating ${trackingId}...`;

      try {
        await updateStatus(trackingId, nextStatus);
        elements.tableMessage.textContent = `${trackingId} updated to ${nextStatus}.`;
        await boot();
      } catch (error) {
        elements.tableMessage.textContent = error.message;
      }
    });
  });
}

async function boot() {
  const [summaryResponse, complaintsResponse] = await Promise.all([
    fetch("/api/admin/summary"),
    fetch("/api/admin/complaints")
  ]);

  const summary = await summaryResponse.json();
  const complaintsPayload = await complaintsResponse.json();

  renderStats(summary);
  renderBreakdown(elements.statusBreakdown, summary.byStatus || []);
  renderBreakdown(elements.categoryBreakdown, summary.byCategory || []);
  renderComplaints(complaintsPayload.complaints || []);
}

boot().catch((error) => {
  elements.tableMessage.textContent = `Dashboard failed to load: ${error.message}`;
});

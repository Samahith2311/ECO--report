// Self-check for src/lib/stats.ts. Run: npm run check:stats (Node 22.18+ runs .ts directly).
import assert from "node:assert/strict";
import { computeStats } from "../src/lib/stats.ts";

const row = (o) => ({
  tracking_id: "ECO-2026-0001", complaint_type: "noise", location_text: "Kuvempunagar",
  latitude: null, longitude: null, complaint_date: "2026-09-10", status: "submitted",
  created_at: "2026-09-10T05:00:00Z", resolved_at: null, ...o,
});

const empty = computeStats([]);
assert.equal(empty.total, 0);
assert.equal(empty.avgResolutionDays, null);
assert.deepEqual(empty.monthly, []);

const s = computeStats([
  row({ status: "resolved", created_at: "2026-09-10T00:00:00Z", resolved_at: "2026-09-12T12:00:00Z" }), // 2.5 days
  row({ status: "resolved", created_at: "2026-09-10T00:00:00Z", resolved_at: "2026-09-11T12:00:00Z", complaint_type: "air_pollution" }), // 1.5 days
  row({ status: "rejected", complaint_date: "2026-12-02", location_text: " kuvempunagar " }),
  row({ status: "under_review", location_text: "Hebbal" }),
]);

assert.equal(s.total, 4);
assert.equal(s.resolved, 2);
assert.equal(s.pending, 1); // under_review only: resolved and rejected don't count
assert.equal(s.avgResolutionDays, 2);
assert.deepEqual(s.byType, { noise: 3, air_pollution: 1 });
assert.deepEqual(s.monthly, [ // Oct and Nov are filled with 0
  { month: "2026-09", count: 3 }, { month: "2026-10", count: 0 },
  { month: "2026-11", count: 0 }, { month: "2026-12", count: 1 },
]);
assert.deepEqual(s.topLocations[0], { name: "Kuvempunagar", count: 3 }); // case/space-insensitive grouping

console.log("stats ok");

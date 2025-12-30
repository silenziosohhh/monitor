const express = require("express");
const router = express.Router();
const db = require("../db");

// get all services and their latest status, hope the join works
router.get("/", async (_, res) => {
  const [rows] = await db.query(`
    SELECT s.id, s.name, s.base_url,
           c.status, c.response_time_ms, c.checked_at
    FROM services s
    LEFT JOIN checks c ON c.id = (
      SELECT id FROM checks
      WHERE service_id = s.id
      ORDER BY checked_at DESC
      LIMIT 1
    )
  `);
  res.json(rows);
});

// get history for a service, pagination is boring but necessary
router.get("/:id/history", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  // fetching the checks from db
  const [rows] = await db.query(
    `
    SELECT status, http_code, response_time_ms, checked_at
    FROM checks
    WHERE service_id = ?
    ORDER BY checked_at DESC
    LIMIT ? OFFSET ?
    `,
    [req.params.id, limit, offset]
  );

  // need total count for the frontend math
  const [[{ total }]] = await db.query(
    "SELECT COUNT(*) as total FROM checks WHERE service_id = ?",
    [req.params.id]
  );

  res.json({
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// get events like failures and recoveries, see what happened
router.get("/:id/events", async (req, res) => {
  const [rows] = await db.query(
    `
    SELECT type, created_at
    FROM events
    WHERE service_id = ?
    ORDER BY created_at DESC
    `,
    [req.params.id]
  );
  res.json(rows);
});

module.exports = router;

const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, x-api-secret",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
      },
      body: ""
    };
  }

  const secret = event.headers["x-api-secret"];
  const store = getStore("tennis-lab");

  // GET — return current picks (public, no auth needed)
  if (event.httpMethod === "GET") {
    try {
      const data = await store.get("picks", { type: "json" });
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify(data || { picks: [], cappers: [], lastUpdated: null })
      };
    } catch (e) {
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({ picks: [], cappers: [], lastUpdated: null })
      };
    }
  }

  // POST — update picks (requires secret)
  if (event.httpMethod === "POST") {
    if (secret !== process.env.API_SECRET) {
      return {
        statusCode: 401,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Unauthorized" })
      };
    }
    try {
      const payload = JSON.parse(event.body);
      payload.lastUpdated = new Date().toISOString();
      await store.setJSON("picks", payload);
      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
        body: JSON.stringify({ success: true, lastUpdated: payload.lastUpdated })
      };
    } catch (e) {
      return {
        statusCode: 500,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: e.message })
      };
    }
  }

  return { statusCode: 405, body: "Method not allowed" };
};

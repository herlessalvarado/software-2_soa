const e = require("express");
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const axios = require("axios").default;

const app = express();
const PORT = 3000;

const authProxy = createProxyMiddleware({
  target: "http://localhost:3001",
  changeOrigin: true,
});

const weatherProxy = createProxyMiddleware({
  target: "http://localhost:3002",
  changeOrigin: true,
});

app.use("/auth/*", (req, res, next) => {
  authProxy(req, res, next);
});

app.use("/weather/*", async (req, res, next) => {
  const token = req.headers.authorization;
  try {
    const isValid = await axios.get("http://localhost:3000/auth/protected", {
      headers: { authorization: token },
    });
    if (isValid.status === 200) {
      weatherProxy(req, res, next);
    } else {
      res.status(isValid.statusCode).json(isValid.body);
    }
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
  }
});

app.use("/", (req, res) => {
  res.status(404).json({ message: "Not Found" });
});

app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
});

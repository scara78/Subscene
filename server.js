const express = require("express");
const cors = require("cors");
const apicache = require("apicache");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 5000;
let cache = apicache.middleware;
app.use(cors());
// app.use(helmet({ poweredBy: false }));
app.use(morgan("tiny"));
app.use(cache("12 hours"));

let index = require("./routes/index");
app.use(index);

let search = require("./routes/search");
app.use(search);

let getsub = require("./routes/getsub");
app.use(getsub);

let sub = require("./routes/sub");
app.use(sub);

let download = require("./routes/download");
app.use(download);

let extra = require("./routes/extra");
app.use(extra);

// Middleware for handling 404 errors
app.use((req, res, next) => {
  const error = new Error("Page Not Found!");
  error.status = 404;
  next(error);
});

// Error handling middleware
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message });
});

app.listen(PORT, () => {
  console.log("Server is running on port " + PORT + "...");
});

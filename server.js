const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

let search = require("./routes/search");
app.use(search);

let getsub = require("./routes/getsub");
app.use(getsub);

let dlsub = require("./routes/dlsub");
app.use(dlsub);

let homepage = require("./routes/homepage");
app.use(homepage);

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

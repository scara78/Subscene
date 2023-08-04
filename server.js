const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

let search = require("./routes/search");
app.use(search);

let getsub = require("./routes/getsub");
app.use(getsub);

let dlsub = require("./routes/dlsub");
app.use(dlsub);

app.listen(PORT, () => {
  console.log("Server is running on port " + PORT + "...");
});

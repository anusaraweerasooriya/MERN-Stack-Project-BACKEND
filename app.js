const express = require("express");
const bodyParser = require("body-parser");

//import places-rotes
const placesRoutes = require("./routes/places-routes");
//import users-routes
const usersRoutes = require("./routes/users-routes");

const HttpError = require("./models/http-error");

const app = express();

//Register Middleware
app.use(bodyParser.json());
app.use("/api/places", placesRoutes); // => /api/places....
app.use("/api/users", usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route", 404);
  throw error;
});

//error handling middleware 404 error page
app.use((error, req, res, next) => {
  if (res.headerSent) {
    return next(error);
  }

  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occurred!" });
});

app.listen(5000);

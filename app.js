const express = require("express");
const bodyParser = require("body-parser");

//import places-rotes
const placesRoutes = require("./routes/places-routes");

const app = express();

//Register Middleware
app.use(placesRoutes);

app.listen(5000);

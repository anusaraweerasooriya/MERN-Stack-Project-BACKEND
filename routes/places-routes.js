const express = require("express");

const router = express.Router();

//Registering route
router.get("/", (req, res, next) => {
  console.log("GET request in Places");
  res.json({ message: "IT works!" });
});

module.exports = router;

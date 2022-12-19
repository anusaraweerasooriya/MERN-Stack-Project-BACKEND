const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 6 },
  image: { type: String },
  places: { type: String, required: true },
});

userSchema.plugin(uniqueValidator); // it will validate the email and only allows to enter a unique email when registering

module.exports = mongoose.model("User", userSchema);

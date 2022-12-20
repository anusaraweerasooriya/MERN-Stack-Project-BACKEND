const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const User = require("../models/user");

//===========================================Getting the users=================================
const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password"); // get all properties except password
  } catch (err) {
    const error = new HttpError(
      "Fetching users failed. Please try again later.",
      500
    );
    return next(error);
  }

  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

//============================================Sign Up===========================================
const signup = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed please check your data!", 422)
    );
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Signing up failed, Please try again later",
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError("User existing already, Please login", 422);
    return next(error);
  }

  const createdUser = new User({
    name, // name: name
    email,
    password,
    image: "https://images.app.goo.gl/xm62mJoYdCTXZuFr8",
    places: [],
  });
  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      "Creating user failed, Please try again later",
      500
    );
    return next(error);
  }

  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
};

//==========================================================================Login======================================
const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    return next(
      new HttpError("Something went wrong could not logged in the user", 500)
    );
  }

  if (!existingUser || existingUser.password !== password) {
    return next(
      new HttpError(
        "COuld not identified user, credentials seem to be wrong",
        401
      )
    );
  }

  res.json({ message: "Logged in!" });
};

exports.getUsers = getUsers;
exports.login = login;
exports.signup = signup;

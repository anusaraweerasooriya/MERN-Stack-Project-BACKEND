const { validationResult } = require("express-validator");
const HttpError = require("../models/http-error");

const uuid = require("uuid").v4;

const DUMMY_USERS = [
  {
    id: "u1",
    name: "Anusara",
    email: "anusara3@gmail.com",
    password: "testers",
  },
];

const getUsers = (req, res, next) => {
  res.json({ users: DUMMY_USERS });
};

const signup = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new HttpError("Invalid inputs passed please check your data!", 422);
  }

  const { name, email, password } = req.body;

  const hasUser = DUMMY_USERS.find((u) => u.email === email);

  if (hasUser) {
    throw new HttpError("Could not create a user, email already exists", 422);
  }

  const createdUser = {
    id: uuid(),
    name, // name: name
    email,
    password,
  };

  DUMMY_USERS.push(createdUser);

  res.status(201).json({ user: createdUser });
};

const login = (req, res, next) => {
  const { email, password } = req.body;

  const identifiedUser = DUMMY_USERS.find((u) => u.email === email);

  if (!identifiedUser || identifiedUser.password !== password) {
    throw new HttpError(
      "COuld not identified user, credentials seem to be wrong",
      401
    );
  }

  res.json({ message: "Logged in!" });
};

exports.getUsers = getUsers;
exports.login = login;
exports.signup = signup;

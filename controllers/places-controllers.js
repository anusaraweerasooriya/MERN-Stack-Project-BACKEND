const fs = require("fs");
const uuid = require("uuid").v4;
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const getCoordsForAddress = require("../util/location");
const Place = require("../models/place");
const User = require("../models/user");
const mongoose = require("mongoose");

//===========================================================Get Place by ID=======================================
const getPlaceById = async (req, res, next) => {
  const placeId = req.params.pid; // { pid: 'p1' }

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError(
      "Something went wrong could ot find the placeId",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError(
      "Could not find a place for the provided id.",
      404
    );
    return next(error);
  }

  res.json({ place: place.toObject({ getters: true }) }); // => { place } => { place: place }
};

//========================================================================================Getting the place by userId==============================
// function getPlaceById() { ... }
// const getPlaceById = function() { ... }
const getPlacesByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  //let places;
  let userWithPlaces;

  try {
    userWithPlaces = await User.findById(userId).populate("places");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not find the userId",
      500
    );
    return next(error);
  }

  // if (!places || places.length === 0)
  if (!userWithPlaces || userWithPlaces.places.length === 0) {
    return next(
      new HttpError("Could not find a places for the provided user id.", 404)
    );
  }

  res.json({
    places: userWithPlaces.places.map((place) =>
      place.toObject({ getters: true })
    ), //underscore from id property is removed by applying a getter
  });
};

//====================================================Create A New Place===================================
const createPlace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Invalid inputs, please check your data", 422));
  }

  const { title, description, address, creator } = req.body;
  // const title = req.body.title;
  let coordinates;
  try {
    coordinates = await getCoordsForAddress(address);
  } catch (error) {
    return next(error);
  }

  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator,
  });

  let user;

  try {
    user = await User.findById(creator);
  } catch (err) {
    const error = new HttpError("Creating place failed. Please try again", 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError("We could not find user for provided ID", 404);
    return next(error);
  }

  console.log(user);

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await createdPlace.save({ session: sess });
    user.places.push(createdPlace);
    await user.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError("Creating place failed", 500);
    return next(error);
  }

  res.status(201).json({ place: createdPlace });
};

//=================================================Updating Places==================================
const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Invalid inputs, please check your data", 422));
  }

  const { title, description } = req.body;
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("Something went wrong, could not update", 500);
    return next(error);
  }

  if (place.creator.toString() !== req.userData.userId) {
    const error = new HttpError("You are not allowed to edit this place", 401);
    return next(error);
  }

  place.title = title;
  place.description = description;

  try {
    await place.save();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not update the place",
      500
    );
    return next(error);
  }

  res.status(200).json({ place: place.toObject({ getters: true }) });
};

//====================================================================Delete a Place======================
const deletePlace = async (req, res, next) => {
  const placeId = req.params.pid;

  let place;
  try {
    place = await Place.findById(placeId).populate("creator");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete the place",
      500
    );
    return next(error);
  }

  if (!place) {
    const error = new HttpError("We could not find place for this ID", 404);
    return next(error);
  }

  if (place.creator.id !== req.userData.userId) {
    const error = new HttpError(
      "You are not allowed to delete this place",
      401 // Unauthorized error
    );
    return next(error);
  }

  const imagePath = place.image;

  // let user;
  // try {
  //   user = User.findById(place.creator);
  // } catch (err) {
  //   const error = new HttpError("Could not find a user for this ID", 500);
  //   return next(error);
  // }

  try {
    const session = await mongoose.startSession();
    session.startTransaction();
    await place.remove({ session: session });
    place.creator.places.pull(place);
    await place.creator.save({ session: session });
    await session.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      "Something went wrong, could not delete the place",
      500
    );
    return next(error);
  }

  fs.unlink(imagePath, (err) => {
    console.log(err);
  });

  res.status(200).json({ message: "Deleted place." });
};

exports.getPlaceById = getPlaceById;
exports.getPlacesByUserId = getPlacesByUserId;
exports.createPlace = createPlace;
exports.updatePlace = updatePlace;
exports.deletePlace = deletePlace;

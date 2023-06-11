const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

function list(req, res) {
  res.json({ data: dishes });
}

function createDish(req, res) {
  const { name, description, price, image_url } = req.body.data;

  const validationError = validateDishData(name, description, price, image_url);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const id = nextId();
  const dish = {
    id,
    name,
    description,
    price,
    image_url,
  };

  dishes.push(dish);

  res.locals.createdDish = dish;
  res.locals.message = 'Dish created successfully.';
  res.status(201).json({ data: dish, message: res.locals.message });
}

function updateDish(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  const { data: { id, name, description, price, image_url } = {} } = req.body;
  const validationError = validateDishData(name, description, price, image_url, type ='update');
  
  if (id && id !== dishId) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}.`,
    });
  }

  if (validationError) {
    return next({
      status: 400,
      message: validationError,
    });
  }

  foundDish.name = name;
  foundDish.description = description;
  foundDish.price = price;
  foundDish.image_url = image_url;

  res.locals.updatedDish = foundDish;
  res.json({ data: foundDish });
}

function validateDishData(name, description, price, image_url) {
  if (price && typeof price !== 'number') {
    return 'price must be a number.';
  }
  
  if (!name || name.trim() === '') {
    return 'name is required.';
  }

  if (!description) {
    return 'description is required.';
  }

  if (!image_url || image_url.trim() === '') {
    return 'image_url is required.';
  }

  if (price === undefined || price === null) {
    return 'price is required.';
  }

  if (price === 0 || price < 0) {
    return 'price must be greater than zero.';
  }

  return null; // No validation errors
}

function dishExists(req, res, next) {
  const dishId = req.params.dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  if (!foundDish) {
    return next({
      status: 404,
      message: `Dish not found: ${dishId}`,
    });
  }

  res.locals.foundDish = foundDish;
  next();
}

function read(req, res, next) {
  const dishId = req.params.dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId);

  if (foundDish) {
    res.locals.dish = foundDish;
    return res.json({ data: foundDish });
  }

  next({ status: 404, message: `Dish does not exist: ${dishId}` });
}

module.exports = {
  list,
  create: createDish,
  read,
  update: [dishExists,updateDish],
};

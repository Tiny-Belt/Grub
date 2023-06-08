const path = require('path');

// Use the existing orders data
const orders = require(path.resolve('src/data/orders-data'));

// Use this function to assign IDs when necessary
const nextId = require('../utils/nextId');

function list(req, res, next) {
  res.json({ data: orders });
}

function create(req, res, next) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {}, } = req.body;
    const validationErrors = validateOrderData(deliverTo, mobileNumber, dishes, status, type='create');
    if (validationErrors.length) {
      return next({
        status: 400,
        message: validationErrors.join(", "),
      });
    }

    const newOrder = {
      id: nextId(),
      deliverTo,
      mobileNumber,
      status,
      dishes,
    };

    orders.push(newOrder);

    res.status(201).json({ data: newOrder });
}




function read(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (!foundOrder) {
    return next({
      status: 404,
      message: `Order not found: ${orderId}`,
    });
  }

  res.json({ data: foundOrder });
}

function update(req, res, next) {
  const { data: { id, deliverTo, mobileNumber, dishes, status } = {} } = req.body;
  const orderId = req.params.orderId;
  const foundOrder = res.locals.foundOrder;
  const validationErrors = validateOrderData(deliverTo, mobileNumber, dishes, status, type='update');
  if (validationErrors.length) {
    return next({
      status: 400,
      message: validationErrors.join(', ')
    });
  }

  if (id && id !== orderId) {
    return next({
      status: 400,
      message: `Order id does not match route id: ${id} !== ${orderId}`
    });
  }

  foundOrder.deliverTo = deliverTo;
  foundOrder.mobileNumber = mobileNumber;
  foundOrder.dishes = dishes;
  foundOrder.status = status;

  res.json({ data: foundOrder });
}

function destroy(req, res, next) {
  const orderId = req.params.orderId;

  const foundOrder = res.locals.foundOrder;

  if (foundOrder.status !== "pending") {
    return next({
      status: 400,
      message: `Order cannot be deleted unless it is pending: ${orderId}`,
    });
  }

  const index = orders.findIndex((order) => order.id === orderId);
  orders.splice(index, 1);
  res.sendStatus(204);
}

function validateOrderData(deliverTo, mobileNumber, dishes, status, type) {
    const errors = [];
    
     if( type=='update') {
      if (!status || status.trim().length === 0) {
      errors.push('status is required');
    } else if (status !== 'pending' && status !== 'preparing' && status !== 'out-for-delivery' && status !== 'delivered') {
      errors.push('status must be one of "pending", "preparing", "out-for-delivery", "delivered"');
    }
    }
    
    if (!deliverTo || deliverTo.trim().length === 0) {
      errors.push('deliverTo is required');
    }

    if (!mobileNumber || mobileNumber.trim().length === 0) {
      errors.push('mobileNumber is required');
    }
    if (!Array.isArray(dishes) || dishes.length === 0) {
      errors.push('Order must include at least one dish');
    } else {
      dishes.forEach((dish, index) => {
        if (!dish.quantity || dish.quantity <= 0) {
          errors.push(`Dish ${index} must have a quantity greater than 0`);
        } else if (!Number.isInteger(dish.quantity)) {
            errors.push(`Dish ${index} must have a quantity that is an integer`);
        }
      });
    }

    return errors;
}

function orderExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);

  if (!foundOrder) {
    return next({
      status: 404,
      message: `Order not found: ${orderId}`,
    });
  }

  res.locals.foundOrder = foundOrder;
  next();
}

module.exports = {
  list,
  create: [create],
  read: [orderExists, read],
  update: [orderExists, update],
  delete: [orderExists, destroy],
};


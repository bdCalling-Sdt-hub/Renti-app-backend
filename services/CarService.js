const Car = require("../models/Car");

exports.createCarService = async (data) => {
    console.log(data)
    const car = await Car.create(data);
    return car;
}

exports.getCarsService = async (document) => {
    try {
        const cars = await Car.find(document);
        return cars
    }
    catch (err) {
        throw new Error(err.message);
    }
}

exports.getById = async (id) => {
    try {
        const car = await Car.findById(id);
        return car
    }
    catch (err) {
        throw new Error(err.message);
    }
}

exports.update = async (id, document, options) => {
    try {
        const update = await Car.findByIdAndUpdate(id, document, options);
        return update
    }
    catch (err) {
        console.log(err);
        if (err.code === 11000) {
            if (err.keyValue?.name) {
                throw new Error("Name already exist");
            }
            if (err.keyValue?.email) {
                throw new Error("Email already exist");
            }
        }
        else {
            throw new Error(err.message.split(":")[2]);
        }
    }
}

exports.remove = async (id) => {
    try {
        const car = await Car.findByIdAndDelete(id);
        return car
    }
    catch (err) {
        console.log(err);
        throw new Error(err.message.split(":")[2]);

    }
}

exports.getsSearchByName = async (searchTerm) => {
    try {
        const cars = await Car.find({ carModelName: searchTerm });
        return cars
    }
    catch (err) {
        console.log(err)
        throw new Error(err.message);
    }
}
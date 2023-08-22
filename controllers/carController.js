const Car = require("../models/Car");
const { createCarService, getCarsService, getById, update, remove, getsSearchByName } = require("../services/CarService");

const createCar = async (req, res) => {
    try {
        const { carModelName, image, year, carLicenseNumber, carDescription, insuranceStartDate, insuranceEndDate, carLicenseImage, carColor, carDoors, carSeats, totalRun, gearType } = req.body;

        // Check if the user already exists
        const carExist = await Car.findOne({ carModelName });
        if (carExist) {
            return res.status(409).json({ message: 'Car already exists! Please Add Another Car' });
        }

        // Create the user in the database
        const car = await Car.create({
            carModelName,
            image,
            year,
            carLicenseNumber,
            carDescription,
            insuranceStartDate,
            insuranceEndDate,
            carLicenseImage,
            carColor,
            carDoors,
            carSeats,
            totalRun,
            gearType
        });

        const cars = await createCarService(car);

        res.status(200).json({
            message: "Car Added Successfully",
            cars: cars
        })

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating user', error });
    }
};

const getCars = async (req, res) => {
    try {
        const query = req.query;
        const cars = await getCarsService(query);
        res.status(200).json({
            message: "Cars retrieved successfully",
            cars: cars
        })
    }
    catch (err) {
        // console.log(err);
        res.status(500).json({
            message: err.message
        })
    }
}

const getCarsById = async (req, res) => {
    try {
        const id = req.params.id;
        const car = await getById(id);
        res.status(200).json({
            message: "Car retrieved successfully",
            cars: car
        })
    }
    catch (err) {
        // console.log(err);
        res.status(500).json({
            message: err.message
        })
    }
}

const updateById = async (req, res) => {
    try {
        const id = req.params.id;
        const options = { new: true };

        const car = await update(id, req.body, options);
        res.status(200).json({
            message: "Car updated successful",
            car
        })
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            message: err.message
        })
    }
}


const deleteById = async (req, res) => {
    try {
        const id = req.params.id;
        console.log(id)

        const exist = await getById(id);
        if (!exist) {
            return res.status(404).json({
                message: "No user found!",
            })
        }

        const car = await remove(id);
        res.status(200).json({
            message: "Car delete successful",
            car
        })
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            message: err.message
        })
    }
}

const searchByName = async (req, res) => {

    try {
        const searchTerm = req.query.carModelName;
        console.log(searchTerm)

        const cars = await getsSearchByName(searchTerm);

        res.status(200).json({
            message: 'Car Searched successfully',
            cars
        })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to perform product filter' });
    }
}


module.exports = { createCar, getCars, getCarsById, updateById, deleteById, searchByName }

const Rent = require("../models/Rent");
async function generateCustomID() {
  try {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');

    let randomDigits = '';

    const number = await Rent.findOne().select('rentTripNumber').sort({ createdAt: -1 });
    if (number && number.rentTripNumber) {
      const lastNumber = parseInt(number.rentTripNumber.split('-')[2]);
      const newNumber = (lastNumber + 1).toString().padStart(5, '0');
      randomDigits = newNumber;
    } else {
      randomDigits = '00001';
    }
    const customID = `RENT-${month}${year}-${randomDigits}`;
    return customID;
  }
  catch (error) {
    next(error)
  }
}

module.exports = generateCustomID;

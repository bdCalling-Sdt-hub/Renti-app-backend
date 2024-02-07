const multer = require('multer');
const path = require('path');

const configureFileUpload = () => {
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname, '../public/uploads/kyc'));
            // if (
            //     file.mimetype === 'image/jpeg' ||
            //     file.mimetype === 'image/png' ||
            //     file.mimetype === 'image/jpg'
            // ) {
            //     // cb(null, path.join(__dirname, '../public/uploads/image'));
            //     cb(null, path.join(__dirname, '../public/uploads/kyc'));
            // }
            // else {
            //     cb(null, path.join(__dirname, '../public/uploads/kyc'));
            // }
        },
        filename: function (req, file, cb) {
            const name = Date.now() + '-' + file.originalname;
            cb(null, name);
        },
    });

    const fileFilter = (req, file, cb) => {
        if (file.fieldname === 'image') {

            file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/heic'
                ? cb(null, true)
                : cb(null, false);
        } else if (file.fieldname === 'KYC') {
            file.mimetype === 'application/msword' || file.mimetype === 'application/pdf' || file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/heic'
                ? cb(null, true)
                : cb(null, false);
        }
    };

    const upload = multer({
        storage: storage,
        fileFilter: fileFilter,
    }).fields([{ name: 'image', maxCount: 3 }, { name: 'KYC', maxCount: 5 }]);

    return upload;
};

module.exports = configureFileUpload;

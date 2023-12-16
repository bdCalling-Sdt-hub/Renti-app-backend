const multer = require('multer');
const path = require('path');

const configureFileUpload = () => {
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            if (
                file.mimetype === 'image/jpeg' ||
                file.mimetype === 'image/png'
            ) {
                cb(null, path.join(__dirname, '../public/uploads/image'));
            } else {
                cb(null, path.join(__dirname, '../public/uploads/kyc'));
            }
        },
        filename: function (req, file, cb) {
            const name = Date.now() + '-' + file.originalname;
            cb(null, name);
        },
    });

    const fileFilter = (req, file, cb) => {
        if (file.fieldname === 'image') {

            file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'
                ? cb(null, true)
                : cb(null, false);
        } else if (file.fieldname === 'KYC') {
            file.mimetype === 'application/msword' || file.mimetype === 'application/pdf' || file.mimetype === 'application/x-x509-ca-cert' || file.mimetype === 'application/octet-stream'
                ? cb(null, true)
                : cb(null, false);
        }
    };

    const upload = multer({
        storage: storage,
        fileFilter: fileFilter,
    }).fields([{ name: 'image', maxCount: 1 }, { name: 'KYC', maxCount: 5 }]);

    return upload;
};

module.exports = configureFileUpload;

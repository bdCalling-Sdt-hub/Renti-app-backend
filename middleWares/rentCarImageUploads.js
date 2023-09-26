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
            }
        },
        filename: function (req, file, cb) {
            const name = Date.now() + '-' + file.originalname;
            cb(null, name);
        },
    });

    const fileFilter = (req, file, cb) => {
        if (file.fieldname === 'carImage') {
            file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'
                ? cb(null, true)
                : cb(null, false);
        }
    };

    const upload = multer({
        storage: storage,
        fileFilter: fileFilter,
    }).fields([{ name: 'carImage', maxCount: 5 }]);

    return upload;
};

module.exports = configureFileUpload;

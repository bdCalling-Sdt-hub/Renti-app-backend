const stripe = require('stripe')('sk_test_51NiWAKHloEqm4Hcr2bW9Od8OZL1ySHO48NmyqgylSNkvRfp3GRAtAPcgr0EldrlZQ5QbnrdPDOTlI8UmIGxv11di00HWChl1wB');
const { v4: uuidv4 } = require('uuid');



const payment = async (req, res) => {
    const { product, token } = req.body;
    console.log("PRODUCT",product);
    console.log("PRICE",product.price);

    const idempontencyKey = uuidv4();

    return stripe.customers.create({
        email: token.email,
        source: token.id,

    })
    .then((customer) => {
        stripe.charges.create({
            amount: product.price * 100,
            currency: 'usd',
            customer: customer.id,
            receipt_eamil: token.email,
            description: `Purchase product ${product.name}`,
            shiping: {
                name: token.id.name,
                address: {
                    country: token.card.address_country
                }
            }
        },{idempontencyKey})
    })
    .then(result => res.status(200).json(result))
    .catch((err) => console.error(err));

};


module.exports = { payment };
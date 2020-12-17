const mongoose = require("mongoose");

const UserdetailSchema = new mongoose.Schema({
    name: String,
    age: Number,
    dob: {
        type: Date
    },
    firstName: String,
    lastName: String,
    more: {
        address1: String,
        address2: String,
        phoneno: String
        }
});

module.exports = mongoose.model('Userdetail', UserdetailSchema);


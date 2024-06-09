import mongoose from 'mongoose';

const reqString = {
    type: String,
    required: true,
};

const schema = new mongoose.Schema({
    _id: reqString, // Guild ID
    message: reqString,
});

export default ({ dbConnection }) => {
    const name = 'recruit-message';

    return (dbConnection.models[name] || dbConnection.model(name, schema));
};
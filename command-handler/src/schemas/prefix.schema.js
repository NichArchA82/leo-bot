import mongoose from 'mongoose';

const reqString = {
    type: String,
    required: true,
};

const schema = new mongoose.Schema({
    _id: reqString, // Guild ID
    prefix: reqString
});

export default ({ dbConnection }) => {
    const name = 'guild-prefixes';

    return (dbConnection.models[name] || dbConnection.model(name, schema));
};
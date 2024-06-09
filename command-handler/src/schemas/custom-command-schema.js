import mongoose from 'mongoose';

const reqString = {
    type: String,
    required: true,
};

const schema = new mongoose.Schema({
    _id: reqString, // Guild ID
    desc: reqString,
    resp: reqString,
    member: reqString,
    reply: {
        type: Boolean,
        required: true,
    }
});

export default ({ dbConnection }) => {
    const name = 'custom-command';

    return (dbConnection.models[name] || dbConnection.model(name, schema));
};
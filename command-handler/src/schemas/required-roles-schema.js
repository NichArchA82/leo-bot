import mongoose from 'mongoose';

const reqString = {
    type: String,
    required: true,
};

const schema = new mongoose.Schema({
    //guildId-commandName
    _id: reqString,
    roles: {
        type: [String],
        required: true,
    }
});

export default ({ dbConnection }) => {
    const name = 'required-roles';

    return (dbConnection.models[name] || dbConnection.model(name, schema));
};
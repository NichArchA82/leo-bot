import mongoose from 'mongoose';

const reqString = {
    type: String,
    required: true,
};

const schema = new mongoose.Schema({
    _id: reqString, // Guild ID
    users: [
        {
            discordUserId: reqString,
            playerId: reqString
        }
    ]
});

export default ({ dbConnection }) => {
    const name = 'synced-users';

    return (dbConnection.models[name] || dbConnection.model(name, schema));
};
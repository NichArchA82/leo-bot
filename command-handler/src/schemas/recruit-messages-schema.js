import mongoose from 'mongoose';

const reqString = {
    type: String,
    required: true,
};

const schema = new mongoose.Schema({
    _id: reqString, // Guild ID
    genGreeting: reqString, //the general greeting message
    promotion: reqString, //the promotion message
    procGreeting: reqString, //the message to send in the inprocessing channel
    eval: reqString, //the message to send in the eval channel
    genChannel: reqString, //the general greeting channel
    procChannel: reqString, //the inprocessing channel
    evalChannel: reqString, //the eval channel
    roChannel: reqString,
    evalMessages: [
        {
            messageId: {
                type: String,
                required: true,
            },
            sponsorId: {
                type: String,
                required: true,
            },
            recruitId: {
                type: String,
                required: true,
            },
            minEvalDate: {
                type: Date,
                required: true,
            },
            cooldown: {
                type: Date,
                required: true,
            }
        }
    ]
});

export default ({ dbConnection }) => {
    const name = 'recruit-messages';

    return (dbConnection.models[name] || dbConnection.model(name, schema));
};
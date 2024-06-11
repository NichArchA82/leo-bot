import mongoose from 'mongoose';

const reqString = {
    type: String,
    required: true,
};

const schema = new mongoose.Schema({
    _id: reqString, // Guild ID
    greeting: reqString, //the greeting message
    promotion: reqString, //the promotion message
    welcome: reqString, //the message to send in the welcome channel
    eval: reqString, //the message to send in the eval channel
    greetChannel: reqString, //the greeting channel
    welChannel: reqString, //the welcome channel
    evalChannel: reqString //the eval channel
});

export default ({ dbConnection }) => {
    const name = 'recruit-messages';

    return (dbConnection.models[name] || dbConnection.model(name, schema));
};
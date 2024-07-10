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
    evalStatus: reqString,
    evalMessages: [
        {
            messageId: {
                type: String, //discord id of the message
                required: true,
            },
            sponsorId: {
                type: String, //discord id of the sponsor
                required: true,
            },
            recruitId: {
                type: String, //discord it of the recruit
                required: true,
            },
            minEvalDate: {
                type: Date, //that that the eval will be put in
                required: true,
            },
            cooldown: {
                type: Date, //date for the cooldown that should be applied
                required: true,
            },
            createdAt: {
                type: Date, //date the message was created at for cooldowns and comparisons.
                default: Date.now,
            }
        }
    ],
    comparisons: [ //used to make sure evaluations don't overlap
        {
            memberId: reqString,
            promotionDate: {
                type: Date,
                default: Date.now,
            },
            removeDate: {
                type: Date,
                default: () => new Date(Date.now() + (60 * 24 * 60 * 60 * 1000)), // 60 days in milliseconds
            }
        }
    ]
});

export default ({ dbConnection }) => {
    const name = 'recruit-messages';

    return (dbConnection.models[name] || dbConnection.model(name, schema));
};
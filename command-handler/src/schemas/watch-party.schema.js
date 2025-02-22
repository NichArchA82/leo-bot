import mongoose from 'mongoose';

const reqString = {
    type: String,
    required: true,
};

const schema = new mongoose.Schema({
    _id: reqString, // guildId-eventId
    channel: reqString, //the channel the event is in
    eventId: reqString, //The id of the event
    role: reqString, //the created role for tentative users
    threads: [
        {
            threadId: reqString, //id of the thread
            threadName: reqString, //name of the thread
            users: [
                {
                    userId: reqString,
                }
            ]
        }
    ],
});

export default ({ dbConnection }) => {
    const name = 'watch-party';

    return (dbConnection.models[name] || dbConnection.model(name, schema));
};
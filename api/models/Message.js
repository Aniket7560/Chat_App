const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
    sender: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    recipient : {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    text : String,
    file : String,
},{timestamps:true}); 

const messageModel = mongoose.model('Message', messageSchema);
module.exports = messageModel;

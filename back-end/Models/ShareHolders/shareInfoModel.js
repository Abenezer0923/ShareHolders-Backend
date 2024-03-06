var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var shareInfoSchema = new Schema({
  numberOfShare: Number,
  amountSubscribed: Number,
  shareCatagory: String,
  shareType: String,
  shareHolder: {
    type: Schema.Types.ObjectId,
    ref: "shareHolder",
  },
  paymentStarted: {
    type: Boolean,
    default: false,
  },
  paymentCompleted: {
    type: Boolean,
    default: false,
  },
});
shareInfoSchema.set("timestamps", true);

module.exports = mongoose.model("shareInfo", shareInfoSchema);

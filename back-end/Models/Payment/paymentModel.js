var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var paymentSchema = new Schema({
  shareHolder: {
    type: Schema.Types.ObjectId,
    ref: "shareHolder",
  },

  shareInfo: {
    type: Schema.Types.ObjectId,
    ref: "shareInfo",
  },

  percentage: {
    type: String,
    default: "0",
  },
  amountPaid: Number,
  amountSubscribed: Number,
});
paymentSchema.set("timestamps", true);

module.exports = mongoose.model("payment", paymentSchema);

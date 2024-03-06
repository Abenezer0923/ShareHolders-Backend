var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var paymentOrderSchema = new Schema({
  bill_ref_number: String,
  paymentMethod: String,
  phoneNumber: String,
  shareHolder: {
    type: Schema.Types.ObjectId,
    ref: "shareHolder",
  },
  amount: Number,
  percentage: String,
  completed: Boolean,
});
paymentOrderSchema.set("timestamps", true);

module.exports = mongoose.model("paymentOrder", paymentOrderSchema);

const axios = require("axios");
exports.comparePrice = async (req, res) => {
  const { minimumOrderValue, cartValue } = req.body;

  if (cartValue >= minimumOrderValue) {
    res.json({
      status: true,
      message: "Cart value meets the minimum order requirement.",
    });
  } else {
    res.json({
      status: false,
      message: "Cart value is below the minimum order requirement.",
    });
  }
};

exports.checkPincode = async (req, res) => {
  const { pincode } = req.body;
  console.log(pincode);
  try {
    const response = await axios.get(
      `https://api.postalpincode.in/pincode/${pincode}`
    );

    console.log(response);
    const postOffices = response.data[0]?.PostOffice || [];
    if (postOffices.length > 0) {
      const state = postOffices[0].State;
      const district = postOffices[0].District;
      console.log("hii");
      // Check if the state is Tamil Nadu, Karnataka, or Kerala
      if (!["Tamil Nadu", "Karnataka", "Kerala"].includes(state)) {
        const pincodeData = {
          pincode: pincode,
          state: state,
          district: district,
        };

        const pincodeRef = db.collection("pincodes").doc();
        await pincodeRef.set(pincodeData);
        const deliveryFee = state == "Tamil Nadu" ? 100 : 150;
        return res
          .status(400)
          .json({ status: false, message: "Not deliverable", deliveryFee });
      }
    } else {
      return res
        .status(400)
        .json({ status: false, message: "Invalid PinCode" });
    }
    return res
      .status(200)
      .json({ status: true, message: " Delivery Available" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching pincode data" });
  }
};

exports.getPrice = async (req, res) => {
  const { totalAmount, taxPercentage, discountPercentage, deliveryFee } =
    req.body;

  const taxAmount = (totalAmount * taxPercentage) / 100;

  const discountAmount = (totalAmount * discountPercentage) / 100;

  const finalAmount = totalAmount + taxAmount - discountAmount + deliveryFee;

  res.json({
    totalAmount,
    taxAmount,
    discountAmount,
    deliveryFee,
    finalAmount,
  });
};

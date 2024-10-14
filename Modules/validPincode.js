const axios = require("axios");
const db = require("../Modules/mysql");
const checkPincode = async (req, res, next) => {
  const { pincode } = req.params;
  try {
    const response = await axios.get(
      `https://api.postalpincode.in/pincode/${pincode}`
    );
    const postOffices = response.data[0]?.PostOffice || [];

    if (postOffices.length > 0) {
      const state = postOffices[0].State;
      const district = postOffices[0].District;
      // Check if the state is Tamil Nadu, Karnataka, or Kerala
      if (!["Tamil Nadu", "Karnataka", "Kerala"].includes(state)) {
        const pincodeData = {
          pincode: pincode,
          state: state,
          district: district,
        };

        const pincodeRef = db.collection("pincodes").doc();
        await pincodeRef.set(pincodeData);
        return res
          .status(400)
          .json({ status: false, message: "Not deliverable" });
      }
    } else {
      return res
        .status(400)
        .json({ status: false, message: "Invalid PinCode" });
    }

    next(); // Call the next middleware or route handler
  } catch (error) {
    res.status(500).json({ error: "Error fetching pincode data" });
  }
};

module.exports = checkPincode;

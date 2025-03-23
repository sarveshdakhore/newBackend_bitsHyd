// frontend will send the query need to pass it to the ML model like the ajaz request and the response need to be sent back to the frontend

import prisma from "../../DB/dbConfig.js";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const ML_URL = process.env.ML_URL;

// get the query from the FE and pass it to the ML model
export const getMLResponse = async (req, res) => {
  try {
    const user = req.payload.userAccount;
    const query = req.body.query;
    if (!query) {
      return res.status(400).json({ message: "Query is required." });
    }
    const response = await axios.post(ML_URL, { query:query, userId: user.id });
    return res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error." });
  }
}





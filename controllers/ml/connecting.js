// frontend will send the query need to pass it to the ML model like the ajaz request and the response need to be sent back to the frontend
import dotenv from "dotenv";
import axios from "axios";
import prisma from "../../DB/dbConfig.js";

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
    console.log("user", user.id, "query", query);
    const response = await axios.post(ML_URL, {
      question: query,
      user_id: user.id,
    });

    // Check if form_struct is null (chat response) or contains a form (form response)
    if (!response.data.form_struct) {
      // Simple chat response
      return res.status(200).json({
        type: "chat",
        message: response.data.generation,
      });
    } else {
      // Form response - need to fetch the form details
      const formId = response.data.form_struct.formId;

      // Fetch the form with its fields
      const form = await prisma.form.findUnique({
        where: { id: formId },
        select: {
          id: true,
          title: true,
          description: true,
          fields: {
            select: {
              order: true,
              formField: {
                select: {
                  id: true,
                  label: true,
                  description: true,
                  fieldType: true,
                  isRequired: true,
                  validations: true,
                },
              },
            },
            orderBy: {
              order: "asc",
            },
          },
        },
      });

      if (!form) {
        return res.status(404).json({
          message: "Form not found",
          type: "chat",
          message: response.data.generation,
        });
      }

      // Format the fields as required
      const formattedFields = form.fields.map((field) => ({
        id: field.formField.id,
        label: field.formField.label,
        description: field.formField.description,
        type: field.formField.fieldType,
        required: field.formField.isRequired,
        validations: field.formField.validations,
        order: field.order,
        // Pre-fill with values from form_struct if available
        value: response.data.form_struct[field.formField.label] || "",
      }));

      // Return the formatted response
      return res.status(200).json({
        type: "form",
        form: {
          id: form.id,
          title: form.title,
          description: form.description,
          fields: formattedFields,
        },
        message: response.data.generation,
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

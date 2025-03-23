import prisma from "../../DB/dbConfig.js";

export const getUserFormMetrics = async (req, res) => {
  try {
    const userId = req.payload?.userAccount?.id || 1;

    const forms = await prisma.form.findMany({
      select: {
        title: true,
        submissions: {
          where: {
            userId: userId,
          },
          select: {
            status: true,
          },
        },
      },
    });

    const metrics = forms.map((form) => {
      const approved = form.submissions.filter(
        (sub) => sub.status === "APPROVED"
      ).length;
      const rejected = form.submissions.filter(
        (sub) => sub.status === "REJECTED"
      ).length;
      const draft = form.submissions.filter(
        (sub) => sub.status === "DRAFT"
      ).length;

      return {
        form_title: form.title,
        approved: approved,
        rejected: rejected,
        draft: draft,
        total: approved + rejected + draft,
      };
    });

    return res.status(200).json(metrics);
  } catch (error) {
    console.error("Error getting user form metrics:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getRecentFormSubmissions = async (req, res) => {
  try {
    const userId = req.payload?.userAccount?.id || parseInt(1);

    if (!userId || isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const submissions = await prisma.formSubmission.findMany({
      where: {
        userId: userId,
      },
      include: {
        form: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
        values: {
          include: {
            field: {
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
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formattedSubmissions = submissions.map((submission) => {
      return {
        id: submission.id,
        formId: submission.formId,
        formTitle: submission.form.title,
        formDescription: submission.form.description,
        status: submission.status,
        createdAt: submission.createdAt,
        updatedAt: submission.updatedAt,
        values: submission.values.map((value) => {
          return {
            id: value.id,
            fieldId: value.fieldId,
            fieldLabel: value.field.label,
            fieldDescription: value.field.description,
            fieldType: value.field.fieldType,
            value: value.value,
            isRequired: value.field.isRequired,
            validations: value.field.validations,
          };
        }),
      };
    });

    return res.status(200).json({
      message: "User form submissions retrieved successfully",
      data: formattedSubmissions,
    });
  } catch (error) {
    console.error("Error getting user form submissions:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


export const submitFormAI = async (req, res) => {
  try {
    const { form_struct, user_id } = req.body;

    // Log the input data
    console.log("Received form_struct:", form_struct);
    console.log("Received user_id:", user_id);

    // Validate input
    if (!form_struct || !form_struct.formId) {
      console.log("Validation failed: Form structure and Form ID are required.");
      return res.status(400).json({ message: "Form structure and Form ID are required." });
    }

    const userId = 1; // Set user ID to 1 permanently
    console.log("Using userId:", userId);

    // Find the form
    const form = await prisma.form.findUnique({
      where: { id: form_struct.formId },
      include: {
        fields: {
          include: {
            formField: true,
          },
        },
      },
    });

    if (!form) {
      console.log("Form not found for formId:", form_struct.formId);
      return res.status(404).json({ message: "Form not found." });
    }

    console.log("Found form:", form);

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.log("User not found for userId:", userId);
      return res.status(404).json({ message: "User not found." });
    }

    console.log("Found user:", user);

    // Prepare form submission data
    const formSubmissionData = {
      formId: form.id,
      userId: user.id,
      status: "SUBMITTED",
      values: form.fields.map((field) => ({
        fieldId: field.formField.id,
        value: form_struct[field.formField.label] || "",
      })),
    };

    console.log("Prepared formSubmissionData:", formSubmissionData);

    // Create form submission
    const formSubmission = await prisma.formSubmission.create({
      data: {
        formId: formSubmissionData.formId,
        userId: formSubmissionData.userId,
        status: formSubmissionData.status,
        values: {
          create: formSubmissionData.values,
        },
      },
    });

    console.log("Created formSubmission:", formSubmission);

    // Update user attributes
    let additionalInfo = user.additional_info || {};
    const results = {};
    let dataUpdated = false;

    for (const [key, value] of Object.entries(form_struct)) {
      if (additionalInfo[key]) {
        results[key] = additionalInfo[key];
      } else {
        additionalInfo[key] = value;
        results[key] = value;
        dataUpdated = true;
      }
    }

    console.log("Prepared additionalInfo:", additionalInfo);
    console.log("Prepared results:", results);

    if (dataUpdated) {
      await prisma.user.update({
        where: { id: userId },
        data: { additional_info: additionalInfo },
      });

      console.log("Updated user profile with new attributes.");

      return res.status(200).json({
        message: "Form submitted and user profile updated successfully.",
        submission: formSubmission,
        updated: true,
        attributes: results,
      });
    }

    console.log("No new attributes were added.");

    return res.status(200).json({
      message: "Form submitted successfully. No new attributes were added.",
      submission: formSubmission,
      updated: false,
      attributes: results,
    });
  } catch (error) {
    console.error("Error submitting form and updating user attributes:", error);
    return res.status(500).json({
      message: "Failed to submit form and update user profile.",
      error: error.message,
    });
  }
};
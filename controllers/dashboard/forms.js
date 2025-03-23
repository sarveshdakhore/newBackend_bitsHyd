import prisma from "../../DB/dbConfig.js";

export const getUserFormMetrics = async (req, res) => {
  try {
    const userId = 1;

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


export const updateFormSubmissionStatus = async (req, res) => {
  try {
    const { submissionId, status } = req.body;
    const user = req.payload.userAccount;

    // Validate input
    if (!submissionId || !status) {
      return res.status(400).json({ message: "Submission ID and status are required." });
    }

    // Check if the user has the "Admin" role
    const userWithRole = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!userWithRole || userWithRole.role.name !== "Admin") {
      return res.status(403).json({ message: "You do not have permission to change the status of form submissions." });
    }

    // Update the form submission status
    const updatedSubmission = await prisma.formSubmission.update({
      where: { id: submissionId },
      data: { status: status },
    });

    return res.status(200).json({
      message: "Form submission status updated successfully.",
      submission: updatedSubmission,
    });
  } catch (error) {
    console.error("Error updating form submission status:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

export const submitFormAI = async (req, res) => {
  try {
    const { formId, userId } = req.body;

    // Validate input
    if (!formId || !userId) {
      return res.status(400).json({ message: "Form ID and User ID are required." });
    }

    // Find the form
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        fields: {
          include: {
            formField: true,
          },
        },
      },
    });

    if (!form) {
      return res.status(404).json({ message: "Form not found." });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Prepare form submission data
    const formSubmissionData = {
      formId: form.id,
      userId: user.id,
      status: "SUBMITTED",
      values: form.fields.map((field) => ({
        fieldId: field.formField.id,
        value: req.body[field.formField.label] || "",
      })),
    };

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

    // Update user attributes
    let additionalInfo = user.additional_info || {};
    const results = {};
    let dataUpdated = false;

    for (const [key, value] of Object.entries(req.body)) {
      if (additionalInfo[key]) {
        results[key] = additionalInfo[key];
      } else {
        additionalInfo[key] = value;
        results[key] = value;
        dataUpdated = true;
      }
    }

    if (dataUpdated) {
      await prisma.user.update({
        where: { id: userId },
        data: { additional_info: additionalInfo },
      });

      return res.status(200).json({
        message: "Form submitted and user profile updated successfully.",
        submission: formSubmission,
        updated: true,
        attributes: results,
      });
    }

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
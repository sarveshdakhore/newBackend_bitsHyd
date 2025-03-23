import prisma from "../DB/dbConfig.js";

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

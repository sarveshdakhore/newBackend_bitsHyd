import prisma from "../DB/dbConfig.js";

export const getUserFormMetrics = async (req, res) => {
  try {
    const userId = 2;

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

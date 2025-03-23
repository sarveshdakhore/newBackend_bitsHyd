import prisma from "../../DB/dbConfig.js";

export const getUserProfile = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);

    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,
        email: true,
        additional_info: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const flatUserData = {
      name: user.name,
      email: user.email,
      ...user.additional_info,
    };

    return res.status(200).json(flatUserData);
  } catch (error) {
    console.error("Error getting user profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getCurrentUserProfile = async (req, res) => {
  try {
    const userId = req.payload.userAccount.id;

    req.params = { userId: userId };
    return getUserProfile(req, res);
  } catch (error) {
    console.error("Error getting current user profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};




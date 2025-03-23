// utils/buffer.js
import prisma from "../DB/dbConfig.js";

export const insertChangeToBuffer = async (userId, storeId, change) => {
  await prisma.buffer.create({
    data: {
      userId: userId,
      storeId: storeId,
      change: change,
    },
  });
};

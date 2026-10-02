import prisma from '../utils/prisma.js'

export const getProfileById = async (sitterId: number) => {
  return await prisma.petsitter.findUnique({
    where: { userid: sitterId },
    include: { USER: true },
  });
};

export const getServicesById = async (sitterId: number) => {
  return await prisma.services.findMany({
    where: { userid: sitterId },
  });
};
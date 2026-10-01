import prisma from '../utils/prisma.js'

export const getServicesBySitter = async (userid: number) => {
  const rows = await prisma.services.findMany({
    where: { userid },
    orderBy: [{ createdat: 'desc' }, { serviceid: 'desc' }],
  })

  return rows.map((s) => ({
    serviceId: s.serviceid,
    serviceName: s.servicename,
    serviceType: s.servicetype,
    species: s.species ?? [],
    price: s.price,
    description: s.description,
    status: s.status,
    createdAt: s.createdat,
  }))
}
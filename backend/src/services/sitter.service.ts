import prisma from '../utils/prisma.js'
import { CreateServiceInput } from '../validators/service.validator.js'

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

export const createService = async (userid: number, input: CreateServiceInput) => {
  const created = await prisma.services.create({
    data: {
      userid,
      servicename: input.serviceName,
      servicetype: input.serviceType,
      species: input.species,
      price: input.price,
      description: input.description ?? null,
      status: 'published',   // 👈 auto-publish: สร้างแล้วเห็นใน search ทันที (US4-1)
    },
  })

  return {
    serviceId: created.serviceid,
    serviceName: created.servicename,
    serviceType: created.servicetype,
    species: created.species,
    price: created.price,
    description: created.description,
    status: created.status,
    createdAt: created.createdat,
  }
}
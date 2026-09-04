import { Request, Response } from 'express'
import prisma from '../../utils/prisma.js'

export const getAllUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.uSER.findMany()
    res.status(200).json({
      success: true,
      data: users,
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error instanceof Error ? error.message : 'Internal server error',
    })
  }
}

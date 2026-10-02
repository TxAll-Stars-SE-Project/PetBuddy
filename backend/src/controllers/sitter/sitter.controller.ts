import { Request, Response } from 'express';
import * as sitterService from '../../services/sitter.service.js'; 

export const getSitterProfile = async (req: Request, res: Response) => {
  try {
    const sitterId = parseInt(String(req.params.sitterID));
    if (isNaN(sitterId)) return res.status(400).json({ status: "error", message: "Invalid Sitter ID" });

    const sitter = await sitterService.getProfileById(sitterId);

    if (!sitter) return res.status(404).json({ status: "error", message: "Sitter not found" });

    res.status(200).json({
      status: "success",
      data: {
        sitterId: sitter.userid,
        username: sitter.USER.username,
        province: sitter.USER.province || "",
        rating: 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

export const getSitterServices = async (req: Request, res: Response) => {
  try {
    const sitterId = parseInt(String(req.params.sitterID));
    if (isNaN(sitterId)) return res.status(400).json({ status: "error", message: "Invalid Sitter ID" });

    const sitterExists = await sitterService.getProfileById(sitterId);
    if (!sitterExists) return res.status(404).json({ status: "error", message: "Sitter not found" });

    const services = await sitterService.getServicesById(sitterId);

    const formattedServices = services.map(srv => ({
      serviceId: srv.serviceid, 
      serviceName: srv.servicename,
      serviceType: srv.servicetype,
      species: srv.species || [],
      price: Number(srv.price),
      description: srv.description || ""
    }));

    res.status(200).json({ status: "success", data: formattedServices });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};
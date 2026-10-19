import { api } from "./api.js";

/**
 * Sitter API Service Layer (Pure JavaScript)
 * 
 * Target endpoints strictly matching docs/API.md Section 4:
 * - GET    /api/users/me (Fetch profile)
 * - GET    /api/sitter/services/me
 * - POST   /api/sitter/services
 * - PATCH  /api/sitter/services/:serviceID
 * - DELETE /api/sitter/services/:serviceID
 */

/**
 * Fetch current authenticated user's profile details.
 * @returns {Promise<Object>}
 */
export const fetchSitterProfile = async () => {
  const res = await api.get("/users/me");
  return res.data?.data;
};

/**
 * Fetch all services owned by current sitter.
 * @returns {Promise<Array>}
 */
export const fetchSitterServices = async () => {
  const res = await api.get("/sitter/services/me");
  return res.data?.data || [];
};

/**
 * Create a new service for the current sitter.
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export const createSitterService = async (payload) => {
  const res = await api.post("/sitter/services", payload);
  return res.data?.data;
};

/**
 * Update an existing service.
 * @param {number|string} serviceId
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export const updateSitterService = async (serviceId, payload) => {
  const res = await api.patch(`/sitter/services/${serviceId}`, payload);
  return res.data?.data;
};

/**
 * Delete a service by its ID.
 * @param {number|string} serviceId
 * @returns {Promise<Object>}
 */
export const deleteSitterService = async (serviceId) => {
  const res = await api.delete(`/sitter/services/${serviceId}`);
  return res.data;
};

/**
 * Sitter In-Memory Cache Manager
 * 
 * 🎓 React Stale-While-Revalidate Architecture:
 * - Stores sitter profile and services in client memory.
 * - When switching between routes (e.g. /sitter/dashboard <-> /profile),
 *   cached data renders immediately within 0ms without layout jump or lag.
 * - Background fetches revalidate data silently and update this cache.
 */

let cachedProfile = null;
let cachedServices = null;
let cachedBookings = null;

/**
 * Retrieves the currently cached sitter profile.
 * @returns {Object|null}
 */
export const getCachedProfile = () => cachedProfile;

/**
 * Updates the cached sitter profile.
 * @param {Object} profile
 * @returns {Object}
 */
export const setCachedProfile = (profile) => {
  cachedProfile = profile;
  return cachedProfile;
};

/**
 * Retrieves the currently cached sitter services array.
 * @returns {Array|null}
 */
export const getCachedServices = () => cachedServices;

/**
 * Updates the cached sitter services array.
 * @param {Array} services
 * @returns {Array}
 */
export const setCachedServices = (services) => {
  cachedServices = Array.isArray(services) ? services : [];
  return cachedServices;
};

/**
 * Adds a new service to the beginning of the cached services list.
 * @param {Object} newService
 */
export const addCachedService = (newService) => {
  if (Array.isArray(cachedServices)) {
    cachedServices = [newService, ...cachedServices];
  }
};

/**
 * Updates an existing service in the cached list by its ID.
 * @param {number|string} targetId
 * @param {Object} updatedFields
 */
export const updateCachedService = (targetId, updatedFields) => {
  if (Array.isArray(cachedServices)) {
    cachedServices = cachedServices.map((item) => {
      const itemId = item.serviceid || item.serviceId;
      if (itemId === targetId) {
        return {
          ...item,
          ...updatedFields,
          servicename: updatedFields.serviceName || updatedFields.servicename || item.servicename,
          serviceName: updatedFields.serviceName || updatedFields.servicename || item.serviceName,
          servicetype: updatedFields.serviceType || updatedFields.servicetype || item.servicetype,
          serviceType: updatedFields.serviceType || updatedFields.servicetype || item.serviceType,
        };
      }
      return item;
    });
  }
};

/**
 * Removes a service from the cached list by its ID.
 * @param {number|string} targetId
 */
export const removeCachedService = (targetId) => {
  if (Array.isArray(cachedServices)) {
    cachedServices = cachedServices.filter(
      (item) => item.serviceid !== targetId && item.serviceId !== targetId
    );
  }
};

/**
 * Retrieves the currently cached sitter bookings array.
 * @returns {Array|null}
 */
export const getCachedBookings = () => cachedBookings;

/**
 * Updates the cached sitter bookings array.
 * @param {Array} bookings
 * @returns {Array}
 */
export const setCachedBookings = (bookings) => {
  cachedBookings = Array.isArray(bookings) ? bookings : [];
  return cachedBookings;
};

/**
 * Clears the sitter cache (e.g. on logout or session reset).
 */
export const clearSitterCache = () => {
  cachedProfile = null;
  cachedServices = null;
  cachedBookings = null;
};

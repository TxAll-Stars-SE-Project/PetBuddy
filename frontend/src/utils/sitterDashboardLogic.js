/**
 * Sitter Dashboard Business Logic & Pure Handlers
 * 
 * 🎓 Layer 1: Pure Functions (Independent of React)
 * - Zero React imports or hook dependencies.
 * - 100% testable without running browser components.
 * - Handles array operations (immutable add/update/delete) and data transformations.
 */

/**
 * Formats a clean Thai address string from a user object.
 * @param {Object} [user]
 * @returns {string}
 */
export const formatSitterAddress = (user) => {
  if (!user) return "";
  const parts = [
    user.address,
    user.subdistrict,
    user.district || user.city,
    user.province,
    user.postalCode,
  ].filter(Boolean);

  return parts.join(" ");
};

/**
 * Resolves initial sitter profile state from user auth context or fallback mock.
 * @param {Object|null} user
 * @param {Object} fallbackMock
 * @returns {Object}
 */
export const resolveInitialProfile = (user, fallbackMock) => {
  if (user?.username) {
    const formattedAddr = formatSitterAddress(user);
    return {
      name: user.username,
      username: user.username,
      tel: user.tel || "",
      address: formattedAddr || user.address || "",
      experience: user.experience || "",
      rating: 5.0,
      reviewCount: 0,
    };
  }
  return fallbackMock;
};

/**
 * Immutably adds a new service item to the beginning of the list.
 * @param {Object[]} list
 * @param {Object} newItem
 * @returns {Object[]}
 */
export const addServiceItem = (list = [], newItem) => {
  return [newItem, ...list];
};

/**
 * Immutably updates an existing service in the list by its ID.
 * @param {Object[]} list
 * @param {number|string} targetId
 * @param {Object} updatedFields
 * @returns {Object[]}
 */
export const updateServiceItem = (list = [], targetId, updatedFields) => {
  return list.map((item) => {
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
};

/**
 * Immutably removes a service from the list by its ID.
 * @param {Object[]} list
 * @param {number|string} targetId
 * @returns {Object[]}
 */
export const deleteServiceItem = (list = [], targetId) => {
  return list.filter((item) => (item.serviceid !== targetId && item.serviceId !== targetId));
};

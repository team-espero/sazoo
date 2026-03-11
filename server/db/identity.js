export const getInstallationKey = (installationId) => `installation:${installationId}`;
export const getUserKey = (userId) => (userId ? `user:${userId}` : null);

export const getOwnerKeys = ({ installationId, userId }) => {
  const keys = [getInstallationKey(installationId)];
  const userKey = getUserKey(userId);
  if (userKey) {
    keys.unshift(userKey);
  }
  return keys;
};

export const parseOwnerKey = (ownerKey) => {
  if (ownerKey.startsWith('installation:')) {
    return { installationId: ownerKey.replace('installation:', ''), userId: null };
  }
  if (ownerKey.startsWith('user:')) {
    return { installationId: null, userId: ownerKey.replace('user:', '') };
  }
  return { installationId: null, userId: null };
};

export const getPrimaryOwnerKey = (identity) => getUserKey(identity?.userId) || getInstallationKey(identity.installationId);

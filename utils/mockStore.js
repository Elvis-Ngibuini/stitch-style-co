const bcrypt = require('bcryptjs');

const mockUsers = new Map();
const mockWishlists = new Map();

const generateMockUserId = () => `mock_user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const mockHashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

const mockMatchPassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

const getMockUserByEmail = (email) => {
  for (const [id, user] of mockUsers) {
    if (user.email === email) return { ...user, _id: id };
  }
  return null;
};

const getMockUserById = (id) => {
  const user = mockUsers.get(id);
  return user ? { ...user, _id: id } : null;
};

module.exports = {
  mockUsers,
  mockWishlists,
  generateMockUserId,
  mockHashPassword,
  mockMatchPassword,
  getMockUserByEmail,
  getMockUserById
};
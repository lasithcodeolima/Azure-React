const User = require('../models/User');

const findUser = async (userData) => {
  const user = await User.findOne({ azureId: userData.azureId });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
};

module.exports = {
  findUser
};

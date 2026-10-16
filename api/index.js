const main = require('../dist/apps/gym-api/main.js');

module.exports = async (req, res) => {
  const handler = main.default || main;
  return handler(req, res);
};

const path = require('path');
const fs = require('fs');

// Static require references to ensure Vercel nft bundles all required dependencies
if (process.env.__VERCEL_STATIC_BUNDLE_FORCE__) {
  require('@nestjs/common');
  require('@nestjs/core');
  require('@nestjs/platform-express');
  require('@nestjs/jwt');
  require('@nestjs/passport');
  require('@prisma/client');
  require('@prisma/adapter-pg');
  require('pg');
  require('bcrypt');
  require('cookie-parser');
  require('express');
  require('class-transformer');
  require('class-validator');
  require('reflect-metadata');
  require('rxjs');
  require('passport');
  require('passport-jwt');
}

function resolveMain() {
  const candidatePaths = [
    path.resolve(__dirname, '../dist/apps/gym-api/main.js'),
    path.resolve(__dirname, 'dist/apps/gym-api/main.js'),
    path.resolve(process.cwd(), 'dist/apps/gym-api/main.js'),
    path.resolve(__dirname, '../../dist/apps/gym-api/main.js'),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  throw new Error(
    `Cannot find main.js. Checked: ${candidatePaths.join(', ')}`
  );
}

let cachedHandler = null;

module.exports = async (req, res) => {
  try {
    if (!cachedHandler) {
      const mainPath = resolveMain();
      const main = require(mainPath);
      cachedHandler = main.default || main;
    }
    return await cachedHandler(req, res);
  } catch (err) {
    console.error('SERVERLESS_INVOCATION_ERROR:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'Serverless Invocation Error',
        message: err.message,
        stack: err.stack,
      })
    );
  }
};

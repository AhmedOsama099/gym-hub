const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/gym-api'),
    clean: true,
    library: {
      type: 'commonjs',
    },
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ["./src/assets"],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      sourceMap: true,
      externalDependencies: [
        '@nestjs/common',
        '@nestjs/core',
        '@nestjs/platform-express',
        '@prisma/client',
        '@prisma/adapter-pg',
        'pg',
        'bcrypt',
        'cookie-parser',
        'express',
        'class-transformer',
        'class-validator',
        'reflect-metadata',
        'rxjs',
        'dotenv',
        'passport',
        'passport-jwt',
      ],
    })
  ],
};

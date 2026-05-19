const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');
config.maxWorkers = 1;
config.stickyWorkers = false;

module.exports = config;

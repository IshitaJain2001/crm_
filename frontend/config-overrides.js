module.exports = function override(config, env) {
  config.module.rules.forEach(rule => {
    if (rule.test && rule.test.toString().includes('source-map')) {
      rule.exclude = /node_modules/;
    }
  });

  config.module.rules.push({
    test: /\.js$/,
    enforce: 'pre',
    use: ['source-map-loader'],
    exclude: [/node_modules\/intro\.js/]
  });

  return config;
};

module.exports = function override(config, env) {
  // Completely disable source maps for intro.js
  config.module.rules = config.module.rules.map(rule => {
    if (rule.use && Array.isArray(rule.use)) {
      rule.use = rule.use.filter(loader => {
        if (typeof loader === 'string') {
          return !loader.includes('source-map-loader');
        }
        return !loader || !loader.loader || !loader.loader.includes('source-map-loader');
      });
    }
    return rule;
  });

  // Add new rule that explicitly excludes intro.js from source map processing
  config.module.rules.unshift({
    test: /intro\.js/,
    use: []
  });

  return config;
};

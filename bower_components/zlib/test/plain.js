(function() {
  for (var key in goog.dependencies_.nameToPath) {
    goog.require(key);
  }
})();

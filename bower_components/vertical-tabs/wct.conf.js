module.exports = {
  'plugins': {
    'local': {
      'browsers': ['chrome']
    },
    'istanbul': {
      'dir': './coverage',
      'reporters': ['text-summary', 'lcov'],
      'include': [
        '/vertical-tabs.html'
      ],
      'exclude': [
        '/bower_components/*'
      ]
    }
  }
};

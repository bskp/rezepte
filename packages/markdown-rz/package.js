Package.describe({
  name: 'markdown-rz',
  summary: "Markdown-to-HTML processor with 'rezepte'-extension",
  version: '1.0.1_1',
  // URL to the Git repository containing the source code for this package.
  git: '',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {
  api.versionsFrom('1.0.1');
  api.addFiles('showdown.js');
  api.addFiles('extensions/rezepte.js');
  api.export('Showdown');
});

Package.onTest(function(api) {
  api.use("blaze", "client");
});

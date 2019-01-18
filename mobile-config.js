// This section sets up some basic app metadata,
// the entire section is optional.
App.info({
  id: 'ee.rezept',
  name: 'Rezepte',
  description: 'Collaborative cookbook built with Meteor',
  author: 'Matthias Roggo',
  email: 'matthias.roggo@gmail.com',
  website: 'http://rezept.ee'
});

// Set up resources such as icons and launch screens.
App.icons({
  'iphone': 'icons/icon-60.png',
  'iphone_2x': 'icons/icon-60@2x.png',
  // ... more screen sizes and platforms ...
});

/*
App.launchScreens({
  'iphone': 'splash/Default~iphone.png',
  'iphone_2x': 'splash/Default@2x~iphone.png',
  // ... more screen sizes and platforms ...
});
*/

// Set PhoneGap/Cordova preferences
App.setPreference('BackgroundColor', '0xff0000ff');
App.setPreference('HideKeyboardFormAccessoryBar', true);
App.setPreference('Orientation', 'default');
App.setPreference('Orientation', 'all', 'ios');
App.setPreference('Fullscreen', 'true');

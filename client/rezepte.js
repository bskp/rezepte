// Client-side JavaScript, bundled and sent to client.

// Define Minimongo collections to match server/publish.js.
Rezepte = new Mongo.Collection("rezepte");
Zutaten = new Mongo.Collection("zutaten");

var rezepteHandle = Meteor.subscribe('rezepte');
var zutatHandle = Meteor.subscribe('zutaten');


Session.setDefault('filter', null);
Session.setDefault('rezept_id', null);
Session.setDefault('editing', false);


////////// Helpers for in-place editing //////////

// Returns an event map that handles the "escape" and "return" keys and
// "blur" events on a text input (given by selector) and interprets them
// as "ok" or "cancel".
var okCancelEvents = function (selector, callbacks) {
  var ok = callbacks.ok || function () {};
  var cancel = callbacks.cancel || function () {};

  var events = {};
  events['keyup '+selector+', keydown '+selector+', focusout '+selector] =
    function (evt) {
      if (evt.type === "keydown" && evt.which === 27) {
        // escape = cancel
        cancel.call(this, evt);

      } else if (evt.type === "keyup" && evt.which === 13 ||
                 evt.type === "focusout") {
        // blur/return/enter = ok/submit if non-empty
        var value = String(evt.target.value || "");
        if (value)
          ok.call(this, value, evt);
        else
          cancel.call(this, evt);
      }
    };

  return events;
};

var activateInput = function (input) {
  input.focus();
  input.select();
};

////////// Suche //////////

Template.suche.events({
    'keyup #suchtext': function (evt) {
        Session.set('filter', evt.target.value)
    }
});


////////// Rezepte //////////

Template.rezepte.events(okCancelEvents(
  '#new-rezept',
  {
    ok: function (name, evt) {
      Rezepte.insert({
        name: name,
        text: null,
      });
      evt.target.value = '';
    }
  }));

Template.rezepte.events({
  'mousedown li': function (evt) { // select list
    Session.set('editing', false);
    Session.set('rezept_id', this._id);
  }
});

Template.rezepte.loading = function() {
    return !rezepteHandle.ready();
}

Template.rezepte.rezepte = function() {
    // Determine recipes to display
    var all = Rezepte.find({}, {sort: {name: 1}})
    var query = Session.get('filter');

    if (query){
        var filtered = [];
        all.map( function(rezept){
            if (rezept.name.toLowerCase().search(query.toLowerCase()) >= 0){
                filtered.push(rezept);
            }
        });
        return filtered;
    } else {
        return all;
    }
}


////////// Zutaten //////////

Template.zutaten.events(okCancelEvents(
  '#new-zutat',
  {
    ok: function (name, evt) {
      Zutaten.insert({
        name: name
      });
      evt.target.value = '';
    }
  }));

Template.zutaten.events({
  'mousedown li': function (evt) { // select list
      alert(evt.target.value);
  }
});

Template.zutaten.zutaten = function() {
    return Zutaten.find();
}

////////// Detail //////////
Template.detail.events({
    'dblclick *': function(evt) {
        console.log('dblclick'+Session.get('rezept_id'));
        Session.set('editing', true);
    },
    'dblclick #editor': function(evt, tmpl) {
        var r = Rezepte.findOne( Session.get('rezept_id') );
        r.text = tmpl.find('textarea').value;

        var html = $(Template.detail.converter.makeHtml(r.text || ''));

        // TODO update ingredient list!

        r.name = html.filter('h1').text();
        r.tags = html.children('.tag');

        Rezepte.update(r._id, r);
        Session.set('editing', false);
    }
});

Template.detail.converter = new Showdown.converter({ extensions: ['rezepte'] });

Template.detail.parse = function() {
    var r = Rezepte.findOne( Session.get('rezept_id') );
    if (r.text){
        return Template.detail.converter.makeHtml(r.text || '');
    } else {
        Session.set('editing', true);
        return ''
    }
}


Template.detail.active = function() {
    return Session.get('rezept_id');
}

Template.detail.editing = function() {
    return Session.get('editing');
}

Template.detail.rezept = function() {
    return Rezepte.findOne( Session.get('rezept_id') );
}

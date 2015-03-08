// Client-side JavaScript, bundled and sent to client.

// Define Minimongo collections to match server/publish.js.
Rezepte = new Mongo.Collection("rezepte");
Zutaten = new Mongo.Collection("zutaten");

var rezepteHandle = Meteor.subscribe('rezepte', function(){
    Session.set('rezept_id', Rezepte.findOne({}, {sort: {name:1}}));
});
var zutatHandle = Meteor.subscribe('zutaten');


Session.setDefault('filter', null);
Session.setDefault('rezept_id', null);
Session.setDefault('editing', false);

//
////////// Suche //////////

Template.suche.events({
    'keyup #suchtext': function (evt) {
        Session.set('filter', evt.target.value)
    }
});


////////// Rezepte //////////

Template.rezepte.events({
  'mousedown li': function (evt) { // change current
    var r = Rezepte.findOne( Session.get('rezept_id') );

    if (r && !r.text){  
        Rezepte.remove(r._id);
    }

    Session.set('editing', false);
    Session.set('rezept_id', this._id);
  },
  'mousedown #new-rezept': function (evt) {
    var curr = Rezepte.insert({
        name: 'Neues Rezept',
        text: null,
    });
    Session.set('rezept_id', curr);
    Session.set('editing', true);
  }
});

Template.rezepte.loading = function() {
    return !rezepteHandle.ready();
}

Template.rezepte.rezepte = function() {
    // Determine recipes to display
    var all = Rezepte.find({}, {sort: {name: 1}})
    var query = Session.get('filter') ? Session.get('filter').toLowerCase() : '';

    if (query){
        var filtered = [];
        all.map( function(rezept){
            if (rezept.name.toLowerCase().search(query) >= 0){
                filtered.push(rezept);
            }
            /*
            if ('tags' in rezept && (rezept.tags.indexOf(query) >= 0)){
                filtered.push(rezept);
            }
            */
            if ('ingr' in rezept && (rezept.ingr.indexOf(query) >= 0)){
                filtered.push(rezept);
            }
        });
        return filtered;
    } else {
        return all;
    }
}


////////// Detail //////////
Template.detail.events({
    'mousedown': function(evt) {
        if (evt.button!=2){ return } // right-click only
        Session.set('editing', true);
    },
    'contextmenu': function(evt) { evt.preventDefault(); },
    'mousedown #editor': function(evt, tmpl) {
        if (evt.button!=2){ return } // right-click only

        var r = Rezepte.findOne( Session.get('rezept_id') );
        r.text = tmpl.find('textarea').value;

        var html = $(Template.detail.converter.makeHtml(r.text || ''));

        // TODO update ingredient list!

        r.name = html.filter('h1').text();
        r.tags = _.map(html.children('.tag'), function(tag){ return tag.innerHTML } )
        r.ingr = _.map(html.filter('ul').find('li i'), function(ingr){ return ingr.innerHTML.toLowerCase() } )

        Rezepte.update(r._id, r);
        Session.set('editing', false);
    },
    'keydown #editor': function(evt, tmpl) {
        if (evt.keyCode == 9){
            evt.preventDefault();
            $(evt.target).insertAtCaret('    ');
        }
        if (evt.keyCode == 13){
            if ($(evt.target).matchLastLine('^    .+')){
                $(evt.target).insertAtCaret('\n    ');
                evt.preventDefault();
            }

            if ($(evt.target).matchLastLine('[=-]+')){
                $(evt.target).insertAtCaret('\n');
            }
        }

    }

});

Template.detail.converter = new Showdown.converter({ extensions: ['rezepte'] });

Template.detail.parse = function() {
    var r = Rezepte.findOne( Session.get('rezept_id') );
    if (r && r.text){
        return Template.detail.converter.makeHtml(r.text || '');
    } else {
        return ''
    }
}


Template.detail.editing = function() {
    return Session.get('editing');
}

Template.detail.rezept = function() {
    return Rezepte.findOne( Session.get('rezept_id') );
}



// Textarea Helpers
$.fn.insertAtCaret = function(string) {
	return this.each(function() {
		var me = this;
		if (document.selection) { // IE
			me.focus();
			sel = document.selection.createRange();
			sel.text = string;
			me.focus();
		} else if (me.selectionStart || me.selectionStart == '0') { // Real browsers
			var startPos = me.selectionStart, endPos = me.selectionEnd, scrollTop = me.scrollTop;
			me.value = me.value.substring(0, startPos) + string + me.value.substring(endPos, me.value.length);
			me.focus();
			me.selectionStart = startPos + string.length;
			me.selectionEnd = startPos + string.length;
			me.scrollTop = scrollTop;
		} else {
			me.value += string;
			me.focus();
		}
	});
}

$.fn.matchLastLine = function(pattern) {
    // Geht im IE nicht. Mir egal!
    pattern = new RegExp(pattern);
    var me = this[0]
    if (me.selectionStart || me.selectionStart == '0') {
        start = me.value.lastIndexOf('\n', me.selectionStart-1);
        var line = me.value.substring(start+1, me.selectionStart);
        return line.match(pattern);
    }
    return false;
}

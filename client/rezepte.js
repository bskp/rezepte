// Client-side JavaScript, bundled and sent to client.

var void_template = '#outdoorküche #vegi\n\nEin Beispielrezept! Der Weg ist das Ziel ~\n\nSandkuchen à la Bruno\n=====================\n\nFür 2 Personen, ca. 20 min.\n\n    2 Blätter Löwenzahn\n    1 kg Sand, grobkörnig\n    1 l Wasser, brackig\n    10 Margeritenköpfe\n\n1. In einem Kessel Wasser abmessen, Sand sorgfältig einrieseln lassen und während 15 min kräftig umrühren.\n2. Kessel herumzeigen. Margeriten beifügen und mit Löwenzahn abschmecken.\n\nIch nehme jeweils Sand, der von Katzen als Klo benutzt wurde. Gibt einfach das vollere Aroma ~mr\n';

// Define Minimongo collections to match server/publish.js.
Rezepte = new Mongo.Collection("rezepte");
Zutaten = new Mongo.Collection("zutaten");
Tags = new Mongo.Collection("tags");

var rezepteHandle = Meteor.subscribe('rezepte', function(){
    FlowRouter.reload()
});
var zutatHandle = Meteor.subscribe('zutaten');
var tagHandle = Meteor.subscribe('tags');

Session.setDefault('filter', null);
Session.setDefault('rezept_id', null);
Session.setDefault('editing', false);

var ingrCache = [];
Tracker.autorun(function () {
    // Provide a ingredients cache for autocompletion
    if (rezepteHandle.ready()){
        ingrCache = _.uniq(Rezepte.find({}, {
                sort: {ingr: 1}, fields: {ingr: true}
            }).fetch().map(function(r) {
                return r.ingr;
            }), true);
        ingrCache = _.flatten(ingrCache);
    }
});


// Cloudinary config
$.cloudinary.config({cloud_name: 'rezepte'});

// Routes

FlowRouter.route('/:name', {
    name: 'view',
    action: function(params) {
        var r = Rezepte.findOne({url: params['name']});
        if (r != undefined){
            Session.set('rezept_id', r._id);
            Session.set('editing', false);
            document.title = 'Rezepte | ' + r.name;
        } else {
            console.log(params['name']+' is no known recipe!');
        }
    },
});

FlowRouter.route('/', {
  name: 'home',
  action: function(_params) {
    start = Rezepte.findOne({}, {sort: {name:1}});
    console.log('ui');
    console.log(start);
    if (start != undefined && start.url != ''){
        FlowRouter.go('view', {name: start.url});
    }
  }
});



////////// List //////////

Template.list.events({
  'keydown #suchtext': function (evt) {
        if (evt.keyCode == 27){  // Escape
            evt.target.value = '';
            evt.preventDefault();
        }
  },
  'keyup #suchtext': function (evt) {
        Session.set('filter', evt.target.value)
        /*
        var typing = evt.target.value.match(/[^ ]*$/)[0];
        if (typing.length){
            
        }
        */
  },
  'click #taglist a': function (evt, tmpl) {
      var search = tmpl.find('#suchtext');
      var tag = '#' + evt.target.innerHTML +' ';
      if (search.value.match(tag)){
          search.value = search.value.replace(tag, '');
      } else {
          search.value += ' ' + tag + ' ';
      }
      search.value = search.value.replace(/  +/g, ' ');
      if (search.value == ' ') search.value = '';
      Session.set('filter', search.value)
  },
  'click #new-rezept': function (evt) {
    var curr = Rezepte.insert({
        name: 'Neues Rezept',
        url: 'neues-rezept',
        text: void_template,
    });
    FlowRouter.go('view', {'name': 'neues-rezept'})
    Session.set('editing', true);
  },
  'click #mode_flip': function (evt) {
      $('body').toggleClass('offset');
  },
  'click #clear_filter': function(evt, tmpl) {
    Session.set('filter', '');
    tmpl.find('#suchtext').value = '';
  }
});

Template.list.helpers({
    loading: function() {
        return !rezepteHandle.ready();
    },
    rezepte: function() {
        // Determine recipes to display
        var query = Session.get('filter') ? Session.get('filter').toLowerCase() : '';

        // Matching ingredient
        re_tags = /(?:^| )#([^ ]+)(?= |$)/g;
        re_ingr = /(?:^| )([^# ]+)(?= |$)/g;

        filter = {};

        var tags = query.mapMatch(re_tags, function(m){ return m[1] });
        if (tags.length){
            $.extend(filter, {'tags': {$all: tags}});
        }

        var ingr = query.mapMatch(re_ingr, function(m){ return m[1] });
        if (ingr.length){
            $.extend(filter, {'ingr': {$all: ingr}});
        }
        
        return Rezepte.find(filter, {sort: {name: 1}});
    },
    is_active: function(rid) {
        return rid == Session.get('rezept_id');
    },
    tags_ready: function() {
        return tagHandle.ready();
    },
    tags: function() {
        var tags = Tags.find({}, {sort: {name: 1}}).fetch();
        for (tag in tags){
            tag = tags[tag];
            // Computed property "active"
            if (tag.rezept.indexOf( Session.get('rezept_id') ) == -1){
                tag.active = false;
            } else {
                tag.active = true;
            }
            // Computed property "color"
            tag.color = 'hsl(' + tag.name.hashCode() + ',30%,50%)';
        }
        return tags
    },

    path: function() {
        return FlowRouter.path('view', {'name': this.url});
    }

})


////////// Detail //////////
Template.detail.events({
    // Start editing
    'contextmenu, click .start_edit': function(evt) {
        var r = Rezepte.findOne( Session.get('rezept_id') );
        FlowRouter.go('view', {'name': r.url})
        Session.set('editing', true);
        evt.preventDefault();
    },
    
    // Save recipe
    'contextmenu #editor, click .stop_edit': function(evt, tmpl) {
        var r = Rezepte.findOne( Session.get('rezept_id') );
        text = tmpl.find('#editor').innerHTML;
        // Ugly way to decode entities:
        tarea = document.createElement("textarea");
        tarea.innerHTML = text;
        r.text = tarea.value;

        var html = $(Template.detail.converter.makeHtml(r.text || ''));

        r.name = html.filter('h1').text();
        r.url = URLify2( r.name );
        r.tags = _.map(html.children('#tags li'), function(tag){ return tag.innerHTML } )
        r.ingr = _.map(html.filter('ul').find('li i'), function(ingr){ return ingr.innerHTML.toLowerCase() } )

        // Update tag index
        Meteor.call('updateTags', r._id, r.tags);

        // Delete recipe if text is empty
        if (!r.text || r.text.length < 3){  
            Rezepte.remove(r._id);
            FlowRouter.go('home')
            return
        }

        Rezepte.update(r._id, r);
        Session.set('editing', false);

        evt.preventDefault();
    },

    // Editor helpers
    'keydown #editor': function(evt, tmpl) {
        if (evt.keyCode == 9){  // Tab
            evt.preventDefault();
            insertAtCaret('    ');
        }
        if (evt.keyCode == 13){  // Enter
            evt.preventDefault();

            if (matchLastLine('^    .+')){
                insertAtCaret('\n    ');
                return
            }

            if (matchLastLine('^[=-]+$')){
                insertAtCaret('\n\n');
                return
            }

            insertAtCaret('\n');

        }
        if (evt.keyCode == 27){  // Escape
            Session.set('editing', false);
            evt.preventDefault();
        }

    },

    // Change quantities
    'click .ingredients b': function(evt, tmpl) {
        var me = $(evt.target);
        me.data('oldVal', eval(me.text()));
        me.focus();
        me.selectText();
        evt.preventDefault();
    },
    'keydown .ingredients b': function(evt, tmpl) {
        if (evt.keyCode == 13){
            $(evt.target).trigger('blur');
            evt.preventDefault();
        }
    },
    'blur .ingredients b': function(evt, tmpl) {
        var me = $(evt.target);
        var ratio = eval(me.text()) / me.data('oldVal');
        if (ratio == 1) return


        $('.ingredients b').each(function(){
            var b = $(this)
            b.addClass('dirty');
            if (b[0] == me[0]) return
            amount = (ratio * eval(b.text()));
            b.text( +amount.toFixed(2) );
        });
    },
    /*
    'mouseenter i': function(evt, tmpl) {
        var needle = evt.target.innerHTML;
        var exp = new RegExp(needle+'(?!</i>)');
        $('#content li, #content p').each(function() {
            var me = $(this);
            me.html( me.html().replace(exp,'<i>'+needle+'</i>') );
        });
        $('i').removeClass('on');
        $('i').each(function() {
            var me = $(this);
            if (me.text() == needle){
                me.addClass('on');
            }
        });
    },
    'mouseleave i': function(evt, tmpl) {
        $('i').removeClass('on');
    },
    */



    /*
    'mouseenter .ingredients i': function(evt, tmpl) {
        $('#content strong').each( function(){
            var me = $(this);
            me.replaceWith( me.text() );
        });
        var needle = evt.target.innerText;

        $('#content li, #content p').each(function() {
            var me = $(this);
            var needle_xp = new RegExp(needle+'(?!</strong>)');
            me.html( me.html().replace(needle_xp,'<strong>'+needle+'</strong>') );
        });
    }
    */


});

Template.detail.converter = new Showdown.converter({ extensions: ['rezepte'] });

Template.detail.helpers({
    parse: function() {
        var r = Rezepte.findOne( Session.get('rezept_id') );
        if (r && r.text){
            var html = Template.detail.converter.makeHtml(r.text || '');
            return html;
        } else {
            return '';
        }
    },

    editing: function() {
        return Session.get('editing');
    },

    rezept: function() {
        return Rezepte.findOne( Session.get('rezept_id') );
    },
})


// Prototype extensions
String.prototype.hashCode = function(){
    // From http://werxltd.com
	var hash = 0;
	if (this.length == 0) return hash;
	for (i = 0; i < this.length; i++) {
		char = this.charCodeAt(i);
		hash = ((hash<<5)-hash)+char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
}


String.prototype.mapMatch = function(re, callback){
    var match = re.exec(this);
    var ret = [];
    while (match != null) {
        ret.push( callback(match) );
        match = re.exec(this);
    }
    return ret;
}


// ContentEditable Helpers
insertAtCaret = function(text) {
    var sel, range;
    sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) {
        range = sel.getRangeAt(0);
        range.deleteContents();
        newTextNode = document.createTextNode(text);
        range.insertNode( newTextNode );
        range.setStartAfter( newTextNode );
        sel.removeAllRanges();
        sel.addRange(range);
    }

    sel.anchorNode.normalize();
}

matchLastLine = function(pattern){
    pattern = new RegExp(pattern);

    var sel = document.getSelection();
    var text = sel.anchorNode.textContent;
    var caretPos = sel.anchorOffset;
    var from = text.substring(0, caretPos).lastIndexOf('\n');
    var line = text.substring(from+1, caretPos);

    return line.match(pattern);
}

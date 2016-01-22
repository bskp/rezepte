// Client-side JavaScript, bundled and sent to client.

var void_template = '#outdoorküche #vegi\n\nEin Beispielrezept! Der Weg ist das Ziel ~\n\nSandkuchen à la Bruno\n=====================\n\nFür 2 Personen, ca. 20 min.\n\n    2 Blätter Löwenzahn\n    1 kg Sand, grobkörnig\n    1 l Wasser, brackig\n    10 Margeritenköpfe\n\n1. In einem Kessel Wasser abmessen, Sand sorgfältig einrieseln lassen und während 15 min kräftig umrühren.\n2. Kessel herumzeigen. Margeriten beifügen und mit Löwenzahn abschmecken.\n\nIch nehme jeweils Sand, der von Katzen als Klo benutzt wurde. Gibt einfach das vollere Aroma ~mr\n';

// Define Minimongo collections to match server/publish.js.
Rezepte = new Mongo.Collection("rezepte");
Zutaten = new Mongo.Collection("zutaten");

var rezepteHandle = Meteor.subscribe('rezepte', function(){
    FlowRouter.reload()
});
var zutatHandle = Meteor.subscribe('zutaten');

Session.setDefault('filter', null);
Session.setDefault('rezept_id', null);
Session.setDefault('editing', false);


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
        } else {
            console.log(params['name']+' is no known recipe!');
        }
    },
});

/*
FlowRouter.route('/:name/edit', {
    name: 'edit',
    action: function(params) {
        var r = Rezepte.findOne({url: params['name']});
        if (r != undefined){
            Session.set('rezept_id', r._id);
            Session.set('editing', true);
        } else {
            console.log(params['name']+' is no known recipe!');
        }
    },
});
*/


FlowRouter.route('/', {
  name: 'home',
  action: function(_params) {
    start = Rezepte.findOne({}, {sort: {name:1}});
    console.log('ui');
    console.log(start);
    if (start != undefined){
        FlowRouter.go('view', {name: start.url});
    }
  }
});

////////// List //////////

Template.list.events({
  'keyup #suchtext': function (evt) {
      Session.set('filter', evt.target.value)
  },
  'click a': function (evt) { // change current
    $('aside#list').removeClass('active');
  },
  'click #new-rezept': function (evt) {
    $('aside#list').removeClass('active');
    var curr = Rezepte.insert({
        name: 'Neues Rezept',
        url: 'neues-rezept',
        text: void_template,
    });
    FlowRouter.go('view', {'name': 'neues-rezept'})
    Session.set('editing', true);
  },
  'click #activate_btn': function (evt) {
      $('aside#list').addClass('active');
  }
});

Template.list.helpers({
    loading: function() {
        return !rezepteHandle.ready();
    },
    rezepte: function() {
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

        // Delete recipe if text is empty
        if (!r.text || r.text.length < 3){  
            Rezepte.remove(r._id);
            FlowRouter.go('home')
            return
        }

        var html = $(Template.detail.converter.makeHtml(r.text || ''));

        // TODO update ingredient list!
        r.name = html.filter('h1').text();
        r.url = URLify2( r.name );
        r.tags = _.map(html.children('.tag'), function(tag){ return tag.innerHTML } )
        r.ingr = _.map(html.filter('ul').find('li i'), function(ingr){ return ingr.innerHTML.toLowerCase() } )

        Rezepte.update(r._id, r);
        FlowRouter.go('view', {'name': r.url})

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

    tags: function() {
        var r = Rezepte.findOne( Session.get('rezept_id') );
        update_tags(r.tags);
        return r.tags;
    },
})


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




// Canvas helpers


update_tags = function(tags) {
  var canvas = document.getElementById('tags');
  var ctx = canvas.getContext('2d');
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.lineWidth = 10;

  for (i in tags) {
    console.log(tags[i]);
    ctx.strokeStyle = getRndColor();
    var x0 = canvas.width - 60 * (1 + parseInt(i));
    ctx.beginPath();
    ctx.moveTo(x0, -5);
    var x_ = x0 + (Math.random() - 0.5) * 100;
    var l = 70 + Math.random() * 50;
    var n = 0;
    for (var j=0; j<2; j++) {
      var dx = (Math.random() - 0.5) * 50;
      ctx.quadraticCurveTo(x_, n * l + l/2, x_ + dx, n * l + l)
      n++;
      x_ = x_ + 2 * dx;
    }
    ctx.globalCompositeOperation = "multiply";
    ctx.stroke();
    
    var x = x_-dx;
    var y = n*l;
    ctx.translate(x, y);
    ctx.rotate( Math.atan2(-1.8*dx, l) - Math.PI/2 );
    ctx.fillStyle = '#fff';
    
    ctx.font = "12px DIN";
    ctx.globalCompositeOperation = "normal";
    ctx.fillText(tags[i].toUpperCase(), 4, 4)
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }
}
getRndColor = function() {
    var h = 360*Math.random()|0;
    return 'hsla(' + h +',100%,30%,1.0)';
}

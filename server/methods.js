Rezepte = new Mongo.Collection('rezepte')
Zutaten = new Mongo.Collection('zutaten')
Tags = new Mongo.Collection('tags')

Meteor.publish('rezepte', function() { return Rezepte.find(); });
Meteor.publish('zutaten', function() { return Zutaten.find(); });
Meteor.publish('tags', function() { return Tags.find(); });


Meteor.methods({

    updateTags: function(rezept_id, tags) {
        
        // Remove all references to this recipe in all Tags
        Tags.update({}, {$pull: {'rezept': rezept_id}}, {multi: true})
        
        tags.forEach(function(tagname) {
            // Create not yet existing tags
            if ( Tags.find({'name': tagname}).count() == 0 ){
                Tags.insert({'name': tagname});
            }
            Tags.update({'name': tagname}, {$push: {'rezept': rezept_id}});
        });

        // Garbage collection
        Tags.remove({'rezept':[]});
    }
});



/*
  addBook: function(title, author) {
    check(title, String); //check if title is String
    check(author, String); //check if author is String

    if (title === '') {
      throw new Meteor.Error(500, "Parameter title can't be empty");
    }

    if (author === '') {
      throw new Meteor.Error(500, "Parameter author can't be empty");
    }

    Books.insert({
      title: title,
      author: author
    });
  }
});
*/

###
Rezepte -- {name: String,
            text: String,
            timestamp: Number,
            }
Rezepte = new Mongo.Collection 'rezepte'
Meteor.publish 'rezepte', -> Rezepte.find()


Zutaten -- {name: String,
            density: Number,
            season: [Number, ...]
            recipes: [id, ...]
            }
Zutaten = new Mongo.Collection 'zutaten'
Meteor.publish 'zutaten', -> Zutaten.find()
@Zutaten = Zutaten


Tags -- {name: String,
          rezept: [id, ...]
          }

Tags = new Mongo.Collection 'tags'
Meteor.publish 'tags', -> Tags.find()

###

appDump.allow = ->
    # no auth requred
    return true

#SERVER
Cloudinary.config
    cloud_name: 'rezepte'
    api_key: '483125915595167'
    api_secret: 'ekhTNrCjyccW3ba9Kk_98A8QsP8'

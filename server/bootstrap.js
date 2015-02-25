// if the database is empty on server start, create some sample data.

Meteor.startup(function() {
    if (Zutaten.find().count() === 0) {
        var data = [
            {name: 'Rüebli, Karotten',
             season: [1,2,3,5,6,7,8,9,10,11,12] },

            {name: 'Lauch',
             season: [1,2,3,4,6,7,8,9,10,11,12] },

            {name: 'Mehl',
             season: true, }
        ]
        for (var i = 0; i < data.length; i++) {
            Zutaten.insert(data[i]);
        }
    }
});

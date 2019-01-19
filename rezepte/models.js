Rezepte = new Mongo.Collection("rezepte");
Zutaten = new Mongo.Collection("zutaten");
Tags = new Mongo.Collection("tags");

var createThumb = function(fileObj, readStream, writeStream) {
  gm(readStream, fileObj.name()).quality(90).resize('300','150^').gravity('Center').crop(300,150).stream().pipe(writeStream);
};

var createFull = function(fileObj, readStream, writeStream) {
  gm(readStream, fileObj.name()).quality(80).resize('600>').stream().pipe(writeStream);
};

var createFuller = function(fileObj, readStream, writeStream) {
  gm(readStream, fileObj.name()).quality(80).resize('1600>').stream().pipe(writeStream);
};

Images = new FS.Collection("images", {
  stores: [
    new FS.Store.GridFS("thumb", { transformWrite: createThumb }),
    new FS.Store.GridFS("full", { transformWrite: createFuller }),
    //new FS.Store.GridFS("fuller", { transformWrite: createFuller }),
    new FS.Store.GridFS("original"),
  ],
  filter: {
    allow: {
      contentTypes: ['image/*'] //allow only images in this FS.Collection
    }
  }
});

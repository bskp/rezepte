import { FilesCollection } from 'meteor/ostrio:files';
var gm = require('gm');

Rezepte = new Mongo.Collection("rezepte");
Zutaten = new Mongo.Collection("zutaten");
Tags = new Mongo.Collection("tags");


var createFuller = function(fileObj, readStream, writeStream) {
  gm(readStream, fileObj.name()).quality(80).resize('1600>').stream().pipe(writeStream);
};

var createThumb = function(fileObj, readStream, writeStream) {
  gm(readStream, fileObj.name()).quality(90).resize('300','150^').gravity('Center').crop(300,150).stream().pipe(writeStream);
};

const bound = Meteor.bindEnvironment((callback) => {
  return callback();
});


const createVersion = function(img, version_label, transform) {
  let fs = require('fs')
  let version_path = Imgs.storagePath + '/' + version_label + '/' + img._id + '.' + img.extension;
  let writeStream = fs.createWriteStream(version_path);

  let readStream = transform(gm(img.path)).stream();

  // Once we have a file, then upload it to our new data storage
  readStream.on('end', () => {
    console.log(version_label + ' version of ' + img.name + ' done.');

    bound(() => {
      upd = {
        $set: {}
      };
      upd['$set']['versions.' + version_label] = {
        path: version_path,
      };
      return Imgs.update(img._id, upd);
    });
  });

  readStream.pipe(writeStream);
}



let fs_storage = '/images';  // within docker container
if (Meteor.isDevelopment) {
  fs_storage = `${process.env.PWD}/../images`;
}

Imgs = new FilesCollection({
  debug: false,
  storagePath: fs_storage,
  permissions: 0o774,
  parentDirPermissions: 0o774,
  collectionName: 'imgs',
  allowClientCode: true, // Allow remove files from Client
  onBeforeUpload: function(file) {
    // Allow upload files under 10MB, and only in png/jpg/jpeg formats
    if (file.size <= 1024*1024*10 && /png|jpg|jpeg/i.test(file.extension)) {
      return true;
    } else {
       return 'Please upload image, with size equal or less than 10MB';
    }
  },
  onAfterUpload: function(file) {
    const image = gm(file.path);
    image.size((error, features) => {
      bound(() => {
        if (error) {
          console.error('size not readable', error);
          return;
        }

        // Update meta data if original image
        Imgs.collection.update(file._id, {
          $set: {
            'meta.width': features.width,
            'meta.height': features.height,
            'versions.original.meta.width': features.width,
            'versions.original.meta.height': features.height
          }
        });
        createVersion(file, 'thumbnail', i => i.quality(90).resize('300', '150^').gravity('Center').crop(300, 150));
        createVersion(file, 'full', i => i.quality(80).resize('1600>'));
    })}); // size + bound

  }
});

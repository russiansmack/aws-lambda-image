var ImageResizer = require("./ImageResizer");
var ImageReducer = require("./ImageReducer");
var S3           = require("./S3");
var Promise      = require("es6-promise").Promise;
var https = require('https');
var ImageData = require("./ImageData");

/**
 * Image processor
 * management resize/reduce image list by configuration,
 * and pipe AWS Lambda's event/context
 *
 * @constructor
 * @param Object s3Object
 * @param Object context
 */
function ImageProcessor(snsEvent) {
    this.snsEvent = snsEvent;
}

/**
 * Run the process
 *
 * @public
 * @param Config config
 */
ImageProcessor.prototype.run = function ImageProcessor_run(config) {
    return new Promise(function(resolve, reject) {

        var file = '';
        var imageData = false;
        var self = this;
        https.get(this.snsEvent.MessageAttributes.DownloadUrl.Value, function (response) {
            response.on('data', function(chunk) {
                file += chunk;
            });
            response.on('end', function() {
                // prints the full file
                console.log('filestop');
                imageData = new ImageData('', '', file, '', '');
                self.processImage(imageData, config)
                    .then(function(results) {
                        S3.putObjects(results)
                            .then(function(images) {
                                resolve(images);
                            })
                            .catch(function(messages) {
                                reject(messages);
                            });
                    })
                    .catch(function(messages) {
                        reject(messages);
                    });
                //resolve(new ImageData('', '', file, '', ''));
            });
/*
            if (!error && response.statusCode == 200) {
                resolve(new ImageData('', '', body, '', ''));
            }
            else
            {
                reject('Not 200 '+error);
            }*/
        });

        console.log('httpstop');

    }.bind(this));
};

ImageProcessor.prototype.processImage = function ImageProcessor_processImage(imageData, config) {
    var jpegOptimizer = config.get("jpegOptimizer", "mozjpeg");
    var promiseList = config.get("resizes", []).filter(function(option) {
            return (option.size && option.size > 0)   ||
                   (option.width && option.width > 0) ||
                   (option.height && option.height > 0);
        }).map(function(option) {
            if ( ! option.bucket ) {
                option.bucket = config.get("bucket");
            }
            if ( ! option.acl ){
                option.acl = config.get("acl");
            }
            option.jpegOptimizer = option.jpegOptimizer || jpegOptimizer;
            return this.execResizeImage(option, imageData);
        }.bind(this));

    if ( config.exists("reduce") ) {
        var reduce = config.get("reduce");

        if ( ! reduce.bucket ) {
            reduce.bucket = config.get("bucket");
        }
        reduce.jpegOptimizer = reduce.jpegOptimizer || jpegOptimizer;
        promiseList.unshift(this.execReduceImage(reduce, imageData));
    }

    return Promise.all(promiseList);
};

/**
 * Execute resize image
 *
 * @public
 * @param Object option
 * @param imageData imageData
 * @return Promise
 */
ImageProcessor.prototype.execResizeImage = function ImageProcessor_execResizeImage(option, imageData) {
    return new Promise(function(resolve, reject) {
        var resizer = new ImageResizer(option);

        resizer.exec(imageData)
        .then(function(resizedImage) {
            var reducer = new ImageReducer(option);

            return reducer.exec(resizedImage);
        })
        .then(function(reducedImage) {
            resolve(reducedImage);
        })
        .catch(function(message) {
            reject(message);
        });
    });
};

/**
 * Execute reduce image
 *
 * @public
 * @param Object option
 * @param ImageData imageData
 * @return Promise
 */
ImageProcessor.prototype.execReduceImage = function(option, imageData) {
    return new Promise(function(resolve, reject) {
        var reducer = new ImageReducer(option);

        reducer.exec(imageData)
        .then(function(reducedImage) {
            resolve(reducedImage);
        })
        .catch(function(message) {
            reject(message);
        });
    });
};

module.exports = ImageProcessor;

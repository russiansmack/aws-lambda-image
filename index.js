var path        = require("path");
var request     = require('request').defaults({ encoding: null });
var ImageMagick = require("imagemagick");
var aws         = require("aws-sdk");
var client      = new aws.S3({apiVersion: "2006-03-01"});
var sizeOf      = require('image-size');

exports.handler = function(event, context) {

    var snsEvent   = event.Records[0].Sns;
    var bucketPath = snsEvent.MessageAttributes.BucketPath.Value;
    var fileName = snsEvent.MessageAttributes.FileName.Value;
    var downloadFromUrl = snsEvent.MessageAttributes.DownloadFromUrl.Value;
    var size = 640;
    var bucketName = 'sergeytestpics';

    function uploadToS3(params)
    {
        return new Promise(function(resolve, reject)
        {
            client.putObject(params, function(err)
            {
                if ( err )
                {
                    reject("Woops, image process failed while putting in s3: " + err);
                }
                else
                {
                    resolve("Image processed");
                }
            });
        });
    }

    request.get(downloadFromUrl, function (err, res, file)
    {
        var imagetype = path.extname(downloadFromUrl).slice(1).toLowerCase();
        var dimensions = sizeOf(file);

        var paramsIM = {
            srcData:   file,
            srcFormat: imagetype,
            format:    imagetype,
            width:     size
        };

        if(dimensions.width > size || dimensions.height > size)
        {
            ImageMagick.resize(paramsIM, function(err, resizedFile, stderr)
            {
                if ( err || stderr )
                {
                    context.fail("Woops, image process failed in imagemagick: " + (err || stderr));
                }
                else
                {
                    var params = {
                        Bucket: bucketName,
                        Key: bucketPath + fileName,
                        Body: new Buffer(resizedFile, "binary")
                    };

                    uploadToS3(params).then(
                        function()
                        {
                            context.succeed('Image resized and placed at ' + params.Bucket + '/' + params.Key);
                        },
                        function(error)
                        {
                            context.fail('Could not place resized image at ' + params.Bucket + '/' + params.Key + 'Error:' + error);
                        }
                    );
                }
            });
        }
        else
        {
            var params = {
                Bucket: bucketName,
                Key: bucketPath + fileName,
                Body: file
            };

            uploadToS3(params).then(
                function()
                {
                    context.succeed('Image placed at ' + params.Bucket + '/' + params.Key);
                },
                function(error)
                {
                    context.fail('Could not place image at ' + params.Bucket + '/' + params.Key + 'Error:' + error);
                }
            );
        }

    });
};

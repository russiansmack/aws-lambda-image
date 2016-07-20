var request     = require('request').defaults({ encoding: null });
var S3          = require("./libs/S3");
var ImageMagick = require("imagemagick");
var aws         = require("aws-sdk");
var client      = new aws.S3({apiVersion: "2006-03-01"});
var path        = require("path");

exports.handler = function(event, context) {

    var snsEvent   = event.Records[0].Sns;
    var bucketPath = snsEvent.MessageAttributes.BucketPath.Value;
    var fileName = snsEvent.MessageAttributes.FileName.Value;
    var downloadFromUrl = snsEvent.MessageAttributes.DownloadFromUrl.Value;
    var size = 640;
    var bucketName = 'sergeytestpics';

    request.get(downloadFromUrl, function (err, res, file)
    {
        var paramsIM = {
            srcData:   file.toString("binary"),
            width:     size
        };

        ImageMagick.resize(paramsIM, function(err, resizedFile, stderr)
        {
            if ( err || stderr )
            {
                context.fail("Woops, image process failed in imagemagick: " + (err || stderr));
            }
            else
            {

                var params = {
                    Bucket: bucketName + bucketPath,
                    Key: fileName,
                    Body: new Buffer(resizedFile, "binary")
                };

                client.putObject(params, function(err)
                {
                    if ( err )
                    {
                        context.fail("Woops, image process failed while putting in s3: " + err);
                    }
                    else
                    {
                        context.succeed("Image processed");
                    }
                });
            }
        });

    });

};

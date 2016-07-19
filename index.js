/**
 * Automatic Image resize, reduce with AWS Lambda
 * Lambda main handler
 *
 * @author Yoshiaki Sugimoto
 * @created 2015/10/29
 */
var ImageProcessor = require("./libs/ImageProcessor");
var Config         = require("./libs/Config");

var fs   = require("fs");
var path = require("path");

// Lambda Handler
exports.handler = function(event, context) {
    //console.log(event.Records[0].Sns);
    /*
     {
     Type: 'Notification',
     MessageId: '43fffdea-e5b8-5a1a-926e-adedaac0c50b',
     TopicArn: 'arn:aws:sns:us-west-2:000335301081:imageprocessing',
     Subject: 'SubjectGoesHere',
     Message: 'dqwdqwqwd',
     Timestamp: '2016-07-18T21:42:16.949Z',
     SignatureVersion: '1',
     Signature: 'ggP+MwGK+lV+84PXPmqwvxZSnZMiqEyBRjS7KiuL4EXf6FKobcBiek4/eyQ2MVUI+YlvEVZCXZmMjYHloQJ69XhRws4s3TSDzVx/ahTGknBCptI3RputMEFHBUzzPsNIyhxHpg1M72hi3Shv3vIqBBoldIO5xPxCrD4CgSQG+dONZucHonAwl8o8csxUq6ky9oZqry29RsWs6bd9fcZXrp3NdSHkhzS7MgaWm9pVcIDEhgkvBiRLXJxl1Mnm9pk1syglXvVcWXa+jpfgZJeStvAXBQW3yDJWl0fljZlGYzAqwPnDiSKsJF6wyPH7Vj6ACiU0jOuNMa9dZkaFaKrPSA==',
     SigningCertUrl: 'https://sns.us-west-2.amazonaws.com/SimpleNotificationService-bb750dd426d95ee9390147a5624348ee.pem',
     UnsubscribeUrl: 'https://sns.us-west-2.amazonaws.com/?Action=Unsubscribe&SubscriptionArn=arn:aws:sns:us-west-2:000335301081:imageprocessing:dea7cb35-3ba8-40fc-87e7-408f9cb4a6d3',
     MessageAttributes: {} }
     */

    var snsEvent   = event.Records[0].Sns;
    var configPath = path.resolve(__dirname, "config.json");
    var processor  = new ImageProcessor(snsEvent);
    var config     = new Config(
        JSON.parse(fs.readFileSync(configPath, { encoding: "utf8" }))
    );

    console.log(snsEvent);
    processor.run(config)
        .then(function(proceedImages) {
            console.log("OK, numbers of " + proceedImages.length + " images has proceeded.");
            context.succeed("OK, numbers of " + proceedImages.length + " images has proceeded.");
        })
        .catch(function(messages) {
            if(messages == "Object was already processed."){
                console.log("Image already processed");
                context.succeed("Image already processed");
            }
            else {
                context.fail("Woops, image process failed: " + messages);
            }
        });

};

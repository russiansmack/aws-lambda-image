## aws-sns-lambda-imageprocessing

An AWS Lambda Function to resize images automatically. When an image is in SNS, this package will download and resize it and put in S3.

### Requirements

- `node.js` ( AWS Lambda working version is **4.3** )
- `make`

### Installation

Clone this repository and install dependencies:

```bash
$ git clone **********.git
$ cd aws-lambda-image
$ npm install .
```

### Packaging

AWS Lambda accepts zip archived package. To create it, run `make lambda` task simply.

```bash
$ make lambda
```

It will create `aws-lambda-image.zip` at project root. You can upload it.

### Developing

```bash
$ make uploadlambda
```
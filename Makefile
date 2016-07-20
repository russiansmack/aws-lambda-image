.PHONY: clean

lambda:
	npm install .
	@echo "Factory package files..."
	@if [ ! -d build ] ;then mkdir build; fi
	@cp index.js build/index.js
	@if [ -d build/node_modules ] ;then rm -rf build/node_modules; fi
	@cp -R node_modules build/node_modules
	@cp -R libs build/
	@cp -R bin build/
	@echo "Create package archive..."
	@cd build && zip -rq aws-sns-lambda-imageprocessing.zip .
	@mv build/aws-sns-lambda-imageprocessing.zip ./

uploadlambda: lambda
	@if [ -z "${LAMBDA_FUNCTION_NAME}" ]; then (echo "Please export LAMBDA_FUNCTION_NAME" && exit 1); fi
	aws lambda update-function-code --function-name ${LAMBDA_FUNCTION_NAME} --zip-file fileb://aws-sns-lambda-imageprocessing.zip

clean:
	@echo "clean up package files"
	@if [ -f aws-sns-lambda-imageprocessing.zip ]; then rm aws-sns-lambda-imageprocessing.zip; fi
	@rm -rf build/*

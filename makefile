build:
	./node_modules/.bin/browserify client/exports.js -o build/gamecarrot-client.js

.PHONY: build
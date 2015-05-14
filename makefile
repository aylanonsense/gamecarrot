bundle:
	./node_modules/.bin/browserify client/index.js -o client/build/gamecarrot-client.js

.PHONY: bundle
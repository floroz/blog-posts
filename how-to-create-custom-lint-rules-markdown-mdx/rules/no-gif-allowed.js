var rule = require("unified-lint-rule");
var visit = require("unist-util-visit");
var generated = require("unist-util-generated");

function isValidNode(node) {
  if (node.url) {
    return !node.url.endsWith(".gif");
  }
}
function noGifAllowed(tree, file, options) {
  visit(tree, "image", visitor);
  function visitor(node) {
    if (!generated(node)) {
      /**
       * This is an extremely simplified example on how to structure
       * the logic to check whether a node violates your rule.
       * You have complete freedom on how to visit/inspect the tree,
       * and how to implement the validation logic for your node.
       * */
      var isValid = isValidNode(node);
      if (!isValid) {
        // remember to pass the node itself alongside message, to obtain the position and column where the violation occurred.
        file.message(
          `Invalid image file extentions. Please do not use gifs`,
          node
        );
      }
    }
  }
}
module.exports = rule("remark-lint:no-gif-allowed", noGifAllowed);

> _TL;DR a step by step guide on how to create and configure a markdown linting rule using `remark` and `remark-lint`_

Markdown is a great tool for productivity when it comes to creating content, blog posts, documentation, etc.

It allows us to quickly write text documents for the web without worrying about formatting, font and text properties, or having to set up HTML boilerplate ourselves.

Whenever more than one contributor is editing the same document, a discussion around what are the _recommended_ practices, or what is _allow_ and what is _forbidden_, will introduce the need of a linting program to enforce and encourage such practices.

### Wait, isn't this about ESLint?

_"Linting is the process of running a program that will analyse code for potential errors"_ [SO](https://stackoverflow.com/questions/8503559/what-is-linting#8503586).

`ESLint` parses JavaScript files into _ES Abstract Syntax Trees_ and evaluate patterns in code.

In the same way, `remark` parses markdown files into _Markdown Abstract Syntax Trees_ and `remark-lint` the pattern in markdown.

It's possible to integrate `remark-lint` with `ESLint`.
If you are interested in integrating your markdown rules in your `ESLint` configuration, refer to [remark-lint integration](https://github.com/remarkjs/remark-lint#integrations) section.

Let's get started!

### 1. Setup the project

Let's start adding our dependencies.

```bash
yarn init -y
```

First, let's install our processor and lint plugin:

```bash
yarn add remark remark-lint remark-cli
```

- [remark](https://github.com/remarkjs/remark): a markdown processor.
- [remark-lint](https://github.com/remarkjs/remark-lint): remark plugins to lint markdown.
- [remark-cli](https://github.com/remarkjs/remark/tree/main/packages/remark-cli): CLI.

Then, we will also need some utilities:

```bash
yarn unified-lint-rule unist-util-generated unist-util-visit
```

These will facilitate creating and managing our custom rules.

### 2. Setup remark

Let's create a `.remarkrc.js`, which will contains all the plugins used by the remark processor.
For details about the configuration, please refer to our [Configuring remark-lint](https://github.com/remarkjs/remark-lint#configuring-remark-lint).

```js
// .remarkrc.js

module.exports = {
  plugins: [],
};
```

then in our `package.json` let's add the following script, which will process all the markdown file within our project

```json
"scripts": {
  "lint": "remark ."
}
```

Now let's create a `doc.md`, which is the markdown file we want to lint:

```md
## Best pets! <3

Some funny images of our favourite pets

![a funny cat](funny-cat.gif)

![a lovely dog](lovely-dog.png)
```

At this point we will have a working `remark` configuration and a markdown file in the project.

If we run `yarn run lint` we should expect to see in our terminal:

```bash
doc.md: no issues found
```

All good, the file has been processed, and because we haven't specified any plugins nor lint rule, no issues are found.

### 4. The `no-invalid-gif` rule:

Let's imagine we want to write a rule that checks whether a `.gif` file is used within an image.

Given the content of our `doc.md` file:

```md
## Best pets! <3

Some funny images of our favourite pets

![a funny cat](funny-cat.gif)

![a lovely dog](lovely-dog.png)
```

We expect an _error_ or _warning_ pointing to `funny-cat.gif`, because the file extension `.gif` violates our rule.

### 5. Create the custom rule

First, let's create a new folder `rules` under the root directory, where we will place all of our custom rules, and create a new file `no-gif-allowed.js`.

_Remember_: the name of the folder and files, and where to place them within your project, is entirely up to you.

In `./rules/no-gif-allowed.js`, let's import the `unified-lint-rule`.
We then export the result of calling `rule` by providing the _namespace and rule name_ (`remark-lint:no-gif-allowed`) as first argument, the _rule itself_ (`noGifAllowed`) as second argument.

```js
var rule = require("unified-lint-rule");
function noGifAllowed(tree, file, options) {
  // rule implementation
}
module.exports = rule("remark-lint:no-gif-allowed", noGifAllowed);
```

Let's say you want all your custom rules to be defined as part of your project namespace. If your project was named `my-project` than you can export your rule as:

```js
module.exports = rule("my-project:no-gif-allowed", noGifAllowed);
```

### 6. Rule arguments

Your rule function will receive three arguments.

```js
function noGifAllowed(tree, file, options) {}
```

- `tree` (_required_): a [mdast](https://github.com/syntax-tree/mdast).
- `file` (_required_): a [virtual file format](https://github.com/vfile/vfile).
- `options` (_optional_): additional information passed to the rule by the remark plugins definition.

### 7. Rule implementation

Because we will be inspecting a [mdast](https://github.com/syntax-tree/mdast), which is a markdown abstract syntax tree built upon [unist](https://github.com/syntax-tree/unist), we can take advantage of the many existing [unist utilities](https://github.com/syntax-tree/unist#utilities) to inspect our tree's nodes.

For this example, we will use [`unist-util-visit`](https://github.com/syntax-tree/unist-util-visit) to recursively inspect all the image nodes, and [`unist-util-generated`](https://github.com/syntax-tree/unist-util-generated) to ensure we are not inspecting nodes that we have generated ourselves and do not belog to the `blog-post.md`.

```js
const rule = require("unified-lint-rule");
const visit = require("unist-visit-util");
const generated = require("unist-util-generated");

function isValidNode(node) {
  // here we check whether the given node violates our rule
  // implementation details are not relevant to the scope of this example.
  // This is an overly semplified solution for demonstration purposes
  if (node.url && typeof node.url === "string") {
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
      const isValid = isValidNode(node);
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
```

### 8. Import the rule in your remark config

Now that our custom rule is defined, and ready to be used, we need to add it to our `remark` configuration.

All you have to do, is to import your rule into the `remark` configuration plugins array:

**Example of a `.remarkrc.js` config file**

```js
// .remarkrc.js
const noGifAllowed = require("./rules/no-gif-allowed.js");

module.exports = {
  plugins: [noGifAllowed],
};
```

### 9. Run the linter

If we now run again the linter `yarn lint` we should see the following message in the terminal

```bash
 5:1-5:30  warning  Invalid image file extentions. Please do not use gifs  no-gif-allowed  remark-lint
```

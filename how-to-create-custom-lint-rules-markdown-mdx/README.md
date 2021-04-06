# How to create custom lint rules for Markdown and MDX using remark and ESLint

> **TL;DR** In this article we are going to setup a basic JavaScript project to parse and compile markdown, and to create and configure custom linting rules using `remark` and `remark-lint`.
>
> - Check the [repository](https://github.com/floroz/blog-posts/tree/main/how-to-create-custom-lint-rules-markdown-mdx) with the example code.

Everyone loves Markdown. It is an exceptional tool to create text documents, blog posts, documentation articles, and it allows us to do so without having to worry about formatting, font, and text properties, or having to set up HTML boilerplate.

There is a myriad of solutions out there to convert our Markdown into HTML pages or to scaffold entire websites out of our documents.

In the last years, modern web development architectures based on client-side JavaScript, reusable APIs and prebuilt Markup ([JAMstack](https://jamstack.org/what-is-jamstack/)), and new web frameworks ([Gatsby](https://github.com/gatsbyjs/gatsby), [Gridsome](https://github.com/gridsome/gridsome) or [Next.js](https://github.com/vercel/next.js)), have gained increased popularity amongst developers, and allowed us to leverage Markdown not just to compile text documents, but to even output interactive UIs where our JavaScript lives within our Markdown ([MDX](https://mdxjs.com/)).

As these solutions scale, and more content writers and developers start contributing to these documents, discussions around what are the _recommended_ practices, or what is _allowed_ and what is _forbidden_, will introduce the need for linting programs to enforce and encourage best standards.

### Table of Contents

- [Set up the project](#set-up-the-project)
- [Set up remark](#set-up-remark)
- [The no-invalid-gif rule:](#the-no-invalid-gif-rule)
- [Create the custom rule](#create-the-custom-rule)
- [Rule arguments](#rule-arguments)
- [Rule implementation](#rule-implementation)
- [Import the rule in your remark config](#import-the-rule-in-your-remark-config)
- [Apply the rule on the Markdown file](#apply-the-rule-on-the-markdown-file)
- [ESlint MDX and Remark](#eslint-mdx-and-remark)

<hr/>

### Set up the project

Let's set up the project and start adding our dependencies.

```bash
yarn init -y
```

Now that we have a `package.json`, we can install our processor and lint plugin:

```bash
yarn add remark remark-lint remark-cli
```

- [remark](https://github.com/remarkjs/remark): a markdown processor.
- [remark-lint](https://github.com/remarkjs/remark-lint): remark plugin to lint markdown.
- [remark-cli](https://github.com/remarkjs/remark/tree/main/packages/remark-cli): CLI.

Because we will be working with [ASTs](https://en.wikipedia.org/wiki/Abstract_syntax_tree), we will also need some utilities:

```bash
yarn unified-lint-rule unist-util-generated unist-util-visit
```

These will help us creating and managing our custom rules.

### Set up remark

With our dependencies all installed, we can start creating a `.remarkrc.js`, which will contain all the plugins that will be consumed by the remark processor.
For details about alternative or advanced configurations, please refer to [Configuring remark-lint](https://github.com/remarkjs/remark-lint#configuring-remark-lint).

```js
// .remarkrc.js

module.exports = {
  plugins: [],
};
```

Then, in our `package.json`, let's add the following script, which will process all the markdown file within our project:

```json
"scripts": {
  "lint": "remark ."
}
```

Let's create a `doc.md`, the markdown file we want to lint:

```md
## Best pets! <3

Some funny images of our favorite pets

![a funny cat](funny-cat.gif)

![a lovely dog](lovely-dog.png)
```

At this point, we have a working `remark` configuration and a markdown file in the project.

If we run `yarn run lint` we should expect to see in our terminal:

```bash
doc.md: no issues found
```

All good, the file has been processed, and because we haven't specified any plugins nor lint rule, no issues are found.

### The no-invalid-gif rule:

Let's imagine we want to write a rule that checks whether a `.gif` file is used within an image.

Given the content of our `doc.md` file:

```md
## Best pets! <3

Some funny images of our favourite pets

![a funny cat](funny-cat.gif)

![a lovely dog](lovely-dog.png)
```

We would expect an _error_ or _warning_ pointing to `funny-cat.gif`, because the file extension `.gif` violates our rule.

### Create the custom rule

Let's create a new folder `rules` under the root directory, where we will place all of our custom rules, and create a new file in it named `no-gif-allowed.js`.

_Remember_: the name of the folder and files, and where to place them within your project, is entirely up to you.

In `./rules/no-gif-allowed.js`, let's import the `unified-lint-rule`.
We then export the result of calling `rule` by providing the _namespace and rule name_ (`remark-lint:no-gif-allowed`) as the first argument, and our implementation of the rule (`noGifAllowed`) as the second argument.

```js
// rules/no-gif-allowed.js

var rule = require("unified-lint-rule");
function noGifAllowed(tree, file, options) {
  // rule implementation
}
module.exports = rule("remark-lint:no-gif-allowed", noGifAllowed);
```

Let's say you want all your custom rules to be defined as part of your project namespace. If your project was named `my-project`, then you can export your rule as:

```js
module.exports = rule("my-project:no-gif-allowed", noGifAllowed);
```

This can help you when wanting to create a group of rules under the same _label_ or _namespace_.

### Rule arguments

Your rule function will receive three arguments.

```js
function noGifAllowed(tree, file, options) {}
```

- `tree` (_required_): a [mdast](https://github.com/syntax-tree/mdast).
- `file` (_required_): a [virtual file format](https://github.com/vfile/vfile).
- `options` (_optional_): additional information passed to the rule by the remark plugins definition.

### Rule implementation

Because we will be inspecting a [mdast](https://github.com/syntax-tree/mdast), which is a markdown abstract syntax tree built upon [unist](https://github.com/syntax-tree/unist), we can take advantage of the many existing [unist utilities](https://github.com/syntax-tree/unist#utilities) to inspect our tree's nodes.

For this example, we will use [`unist-util-visit`](https://github.com/syntax-tree/unist-util-visit) to recursively inspect all the image nodes, and [`unist-util-generated`](https://github.com/syntax-tree/unist-util-generated) to ensure we are not inspecting nodes that we have generated ourselves and do not belong to the `blog-post.md`.

```js
const rule = require("unified-lint-rule");
const visit = require("unist-visit-util");
const generated = require("unist-util-generated");

function isValidNode(node) {
  // here we check whether the given node violates our rule
  // implementation details are not relevant to the scope of this example.
  // This is an overly simplified solution for demonstration purposes
  if (node.url && typeof node.url === "string") {
    return !node.url.endsWith(".gif");
  }
}
function noGifAllowed(tree, file, options) {
  visit(tree, "image", visitor);
  function visitor(node) {
    if (!generated(node)) {
      /**
       * This is an extremely simplified example of how to structure
       * the logic to check whether a node violates your rule.
       * You have complete freedom over how to visit/inspect the tree,
       * and on how to implement the validation logic for your node.
       * */
      const isValid = isValidNode(node);
      if (!isValid) {
        // remember to provide the node as second argument to the message,
        // in order to obtain the position and column where the violation occurred.
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

### Import the rule in your remark config

Now that our custom rule is defined, and ready to be used, we need to add it to our `remark` configuration.

All you have to do is to import your rule into the `remark` configuration plugins array:

```js
// .remarkrc.js
const noGifAllowed = require("./rules/no-gif-allowed.js");

module.exports = {
  plugins: [noGifAllowed],
};
```

### Apply the rule on the Markdown file

If you run `yarn lint`, you should see the following message in the terminal:

```bash
 5:1-5:30  warning  Invalid image file extentions. Please do not use gifs  no-gif-allowed  remark-lint
```

The rule works, congratulations!

### Markdown to MDX

Hold on, we are now told that we need to start supporting into our project also MDX files, and that our rules must apply to those as well.

A new file is created in the project, `doc.mdx`,to start using our new `ParagraphComponent` inside MDX.

```mdx
## Best pets! <3

<ParagraphComponent props="I am a new paragraph" />

Some funny images of our favourite pets

![a funny cat](funny-cat.gif)

![a lovely dog](lovely-dog.png)
```

Fine, we now run our `yarn lint` again and check the terminal output:

```bash
doc.md
  5:1-5:30  warning  Invalid image file extentions. Please do not use gifs  no-gif-allowed  remark-lint
```

Ouch! it seems our `.mdx` file is not seen or parsed by `remark` and the rule is not applied! Lets' take care of that.

### ESlint MDX and Remark

In order to correctly parse and lint MDX files, we will need a parser. A great solution for this is `eslint-mdx`, so let's install it.

```bash
yarn add eslint eslint-plugin-mdx
```

- [ESLint](https://github.com/eslint/eslint): the most popular tool for linting JavaScript code.
- [ESLint MDX](https://github.com/mdx-js/eslint-mdx): an ESLint plugin/parser for MDX files.

We will need to create a ESLint config to pass the settings for MDX and configure the plugin.

Let's create a `.eslintrc.js` in the root of our project with the following:

```js
module.exports = {
  extends: ["plugin:mdx/recommended"],
  parserOptions: {
    ecmaVersion: 2015,
  },
  settings: {
    // Integration with remark-lint plugins,
    // it will read remark's configuration automatically via .remarkrc.js
    "mdx/remark": true,
  },
};
```

So what is going on here?

1. We have created a new ESLint configuration that uses the `eslint-plugin-mdx.
2. `eslint-plugin-mdx` will use `eslint-mdx` to parse and process MDX files.
3. We have declared the `mdx/remark` setting, which integrates our remark plugins system into ESLint. This means that our remark custom rule, and any other plugin in our `.remarkrc.js`, will be pulled into ESLint processor and applied.

Okay, now it's time to update our `package.json` with a new `lint` script:

```json
"scripts": {
  "lint": "eslint . --ext md,mdx"
}
```

We are configuring ESLint to parse and process all the files in our project with either a `.md` or `.mdx` extension.

If we now run `yarn lint` we should see in the terminal:

```bash
$ eslint . --ext md,mdx

doc.md
  5:1  warning  Invalid image file extentions. Please do not use gifs  remark-lint-no-gif-allowed

doc.mdx
  7:1  warning  Invalid image file extentions. Please do not use gifs  remark-lint-no-gif-allowed
```

Our custom rule has been correctly applied both to Markdown and MDX!

import { Plugin } from "obsidian";
import posthtml from "posthtml";

export default class MyPlugin extends Plugin {
  async onload() {
    this.registerMarkdownPostProcessor(async (element, context) => {
      const admonitions = element.querySelectorAll("p");

      // Bit of a long way around.
      // Originally, I made the change to `element` and just updated
      // the document preview contents, but that breaks prism, so, we
      // iterate over each `p` tag and only update those specific items.
      for (let index = 0; index < admonitions.length; index++) {
        const admonition = admonitions.item(index);
        if (
          admonition.innerHTML.startsWith(":::") &&
          admonition.innerHTML.endsWith(":::")
        ) {
          const result = (
            await posthtml()
              .use(posthtmlAdmonitions)
              .process(admonition.outerHTML)
          ).html;

          // Parent should be a wrapping div.
          admonition.parentElement.innerHTML = result;
        }
      }
    });
  }
}

// TODO: Sort out these types.
function posthtmlAdmonitions(tree: any) {
  tree.match({ tag: "p" }, (node: any) => {
    if (
      !node.content ||
      node.content.length === 0 ||
      (node.content.length > 0 &&
        (!node.content[0].startsWith(":::") ||
          !node.content[node.content.length - 1].endsWith("\n:::")))
    ) {
      return node;
    }

    const newContent = node.content
      .filter((item: any) => typeof item === "string" || item.tag !== "br")
      .slice(0, -1);
    const [, defaultTitle = "Note", ...titleItems] = newContent[0].split(" ");
    newContent[0] = {
      tag: "div",
      content: [titleItems.join(" ") || defaultTitle],
      attrs: { class: "admonition__heading" },
    };
    newContent[1] = {
      tag: "div",
      content: newContent.slice(1),
      attrs: { class: "admonition__content" },
    };

    Object.assign(node, {
      tag: "div",
      attrs: {
        class: `admonition admonition--${defaultTitle.toLowerCase()}`,
      },
    });

    node.content = newContent.slice(0, 2);
    return node;
  });
}

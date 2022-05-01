import { printLine } from './modules/print';
import cheerio from 'cheerio'
// import { renderRecipe } from './modules/renderer';

console.log('Content script works!');
console.log("doc: " + JSON.stringify(document));
console.log('Must reload extension for modifications to take effect.');

printLine("Using the 'printLine' function from the Print Module");

function sendMessage(recipe) {
  chrome.runtime.sendMessage({recipe: recipe}, function(response) {
    console.log(JSON.stringify(response));
  });
}

function parseRecipe(html) {
  const $ = cheerio.load(html);
  let jsonld;

  let nodesList = $('script[type="application/ld+json"]')

  for (var i = 0; i < nodesList.length; i++) {

    console.log("checking: " + i);

    const node = nodesList[i]

    try {
      jsonld = JSON.parse(node.firstChild.data)

      // if json+ld presents as an array of jsonld objects
      if (Array.isArray(jsonld)) {
        let filteredList = jsonld.filter(function(schemaFilter) {
          return schemaFilter["@type"] == "Recipe";
        })

        jsonld = filteredList.pop()
      }

      // Simplest format. Top level recipe
      if (jsonld && jsonld.recipeIngredient && jsonld.recipeInstructions && jsonld.name) {

        // Rare issue. Instruction array is wrapped in an extra array.
        // https%3A%2F%2Ffood52.com%2Frecipes%2F87220-sambal-potatoes-aioli-recipe
        if (!jsonld.recipeInstructions[0].text) {
          jsonld.recipeInstructions = jsonld.recipeInstructions[0]
        }

        return {
          message: "Recipe parsing successful.",
          ingredients: jsonld.recipeIngredient.map((ing) => ing.replace(/<\/?[^>]+(>|$)/g, "")),
          directions: jsonld.recipeInstructions.map((dir) => dir.text.replace(/<\/?[^>]+(>|$)/g, "")),
          title: jsonld.name
        }
      }
      // Recipe is nested within @graph type
      else if (jsonld["@graph"]){
        let rec = jsonld["@graph"].filter(function(schemaFilter) {
          return schemaFilter["@type"] == "Recipe";
        })

        if (rec.length > 0) {
          return {
            message: "Recipe parsing successful.",
            ingredients: rec[0].recipeIngredient.map((ing) => ing.replace(/<\/?[^>]+(>|$)/g, "")),
            directions: rec[0].recipeInstructions.map((dir) => dir.text.replace(/<\/?[^>]+(>|$)/g, "")),
            title: rec[0].name
          }
        } else if ( i == nodesList.length-1 ) {
          return { message: "Can't find recipe markup." }
        }
      }
      else if ( i == nodesList.length-1 ) {
        console.log("jsonld: " + JSON.stringify(jsonld))
        return { message: "Recipe markup missing" }
      }
    } catch (err) {
      return { message: "json+ld parsing failed" }
    }

  }

}

function checkForRecipe(html) {
  return html.includes("ld+json")
}

function DOMtoString(document_root) {
  var html = '',
    node = document_root.firstChild;

  while (node) {
      switch (node.nodeType) {
      case Node.ELEMENT_NODE:
          html += node.outerHTML;
          break;
      case Node.TEXT_NODE:
          html += node.nodeValue;
          break;
      case Node.CDATA_SECTION_NODE:
          html += '<![CDATA[' + node.nodeValue + ']]>';
          break;
      case Node.COMMENT_NODE:
          html += '<!--' + node.nodeValue + '-->';
          break;
      case Node.DOCUMENT_TYPE_NODE:
          // (X)HTML documents are identified by public identifiers
          html += "<!DOCTYPE " + node.name + (node.publicId ? ' PUBLIC "' + node.publicId + '"' : '') + (!node.publicId && node.systemId ? ' SYSTEM' : '') + (node.systemId ? ' "' + node.systemId + '"' : '') + '>\n';
          break;
      }
      node = node.nextSibling;
  }

  let recipeMessage

  if ( checkForRecipe(html) ) {
    console.log("some recipe detected");
    recipeMessage = parseRecipe(html)
  } else {
    console.log("no recipe detected");
    recipeMessage = {
      message: "json+ld formatting was not detected."
    }
  }

  console.log("response: " + JSON.stringify(recipeMessage) + "\n" + html);

  if (recipeMessage.message == "Recipe parsing successful.") {
    console.log("icon color");

    chrome.runtime.sendMessage({
        action: "setIcon",
        color: true
    });

  } else {
    console.log("icon gray");

    chrome.runtime.sendMessage({
        action: "setIcon",
        color: false
    });
  }

  chrome.storage.local.set({
    recipe: recipeMessage
  }, storageCallback() );
}

function storageCallback() {
  console.log('called back after storage?');
}

function gotMessage(message, sender, sendResponse) {
  console.log(JSON.stringify("message: " + message));
}

chrome.runtime.onMessage.addListener(gotMessage);

chrome.runtime.sendMessage({
    action: "getSource",
    source: DOMtoString(document)
});

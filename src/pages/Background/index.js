console.log('This is the background page.');
console.log('Put the background scripts here.');

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("message received from: " + JSON.stringify(sender.tab))
    console.log(sender.tab ? "from a content script:" : "from the extension");
    console.log("rec msg: " + JSON.stringify(request));

    if (request.action == "setIcon") {
      if (request.color) {
        console.log("color is true");

        chrome.action.setIcon({
          path: {
            "16": "16_icon.png",
            "32": "32_icon.png",
            "48": "48_icon.png",
            "128": "128_icon.png",
          },
          tabId: sender.tab.id
        })
      } else {
        console.log("color is false");

        chrome.action.setIcon({
          path: {
            "16": "16_gray.png",
            "32": "32_gray.png",
            "48": "48_gray.png",
            "128": "128_gray.png",
          },
          tabId: sender.tab.id
        })
      }
    }

    if (request.recipe && request.recipe.message == 'Recipe parsing successful.') {
      console.log("theres a recipe in the bg");
    }
    else {
      console.log("no rec in the bg");
    }
  }
);

function script() {
  chrome.storage.local.get("recipe", function (recipeMessage) {
    console.log("rec: " + JSON.stringify(recipeMessage));

    const recipeElement = document.getElementsByClassName("funkyradish-recipe-container");

    if (recipeElement.length > 0) {
      recipeElement[0].parentNode.removeChild(recipeElement[0])
    }
    else {
      let ingredients = recipeMessage.recipe.ingredients.map((ing, i) => {
        return '<li><input type="checkbox">' + ing + '</input></li>'
      }).join("\n")

      let directions = recipeMessage.recipe.directions.map((dir, i) => {
        return '<li>' + dir + '</li>'
      }).join("\n")

      let string = `
        <div class="recipe">
          <div class="recipe-title">
            {title}
          </div>
          <div class="recipe-ingredients">
            <ul>
              {ingredients}
            </ul>
          </div>
          <div class="recipe-directions">
            <ul>
              {directions}
            </ul>
          </div>
        </div>
      `
      string = string.replace('{ingredients}', ingredients)
      string = string.replace('{directions}', directions)
      string = string.replace('{title}', recipeMessage.recipe.title)

      var div = document.createElement("div");
      div.className = "funkyradish-recipe-container";
      div.innerHTML = string;
      document.body.appendChild(div);
    }
  });
}

chrome.action.onClicked.addListener(function (tab) {
  chrome.scripting.executeScript({
    target: {tabId: tab.id, allFrames: true},
    func: script
  },
  () => {
    console.log("callback");
  });
});

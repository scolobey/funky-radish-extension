console.log('This is the background page.');
console.log('Put the background scripts here.');

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    console.log("message received from: " + JSON.stringify(sender.tab))
    console.log(sender.tab ? "from a content script:" : "from the extension");
    console.log("rec msg: " + JSON.stringify(request));

    if (request.action == "setIcon") {
      if (request.color) {
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
        <div class="fr-recipe">
          <div class="fr-recipe-header">
            <div class="fr-recipe-title">
              {title}
            </div>
            <a href="{import-link}">
              <label for="bookmark" class="fr-btn fr-btn-bookmark">
                <svg>
                  <use xlink:href="#icon-bookmark"/>
                </svg>
              </label>
            </a>
            <svg>
              <symbol fill="transparent" viewBox="0 0 24 24" stroke="currentColor" id="icon-bookmark">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
              </symbol>
            </svg>
          </div>
          <div class="fr-recipe-ingredients">
            <ul>
              {ingredients}
            </ul>
          </div>
          <div class="fr-recipe-directions">
            <ul>
              {directions}
            </ul>
          </div>
        </div>
      `
      string = string.replace('{ingredients}', ingredients)
      string = string.replace('{directions}', directions)
      string = string.replace('{title}', recipeMessage.recipe.title)
      string = string.replace('{import-link}', 'https://www.funkyradish.com/builder/import/' + encodeURIComponent(recipeMessage.recipe.url))

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

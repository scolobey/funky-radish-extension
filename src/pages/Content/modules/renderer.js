export const renderRecipe = (recMessage) => {
  console.log('render time: ' + JSON.stringify(recMessage));

  let ingredients = recMessage.ingredients.map((ing, i) => {
    return '<li>' + ing + '</li>'
  }).join("\n")

  let directions = recMessage.directions.map((dir, i) => {
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
  string = string.replace('{title}', recMessage.title)

  return string
};

import requests

# Use free test key
api_key = "1"
url = f"https://www.themealdb.com/api/json/v1/{api_key}/list.php?i=list"

ingredients = set()

response = requests.get(url)
data = response.json()

if data and "meals" in data and data["meals"]:
    for item in data["meals"]:
        ingredient = item.get("strIngredient")
        if ingredient:
            ingredients.add(ingredient.strip())

# Print all unique ingredients
for ing in sorted(ingredients):
    print(ing)
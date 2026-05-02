# MongoDB Schema

## Collection: recipes

| Field | Type | Description |
| --- | --- | --- |
| _id | ObjectId | Unique recipe identifier |
| title | String | Recipe title |
| description | String | Short description |
| category | String | Recipe category |
| ingredients | Array<Object> | Embedded ingredient list |
| ingredients.name | String | Ingredient name |
| ingredients.quantity | String | Ingredient quantity |
| ingredients.unit | String | Ingredient unit |
| instructions | Array<String> | Ordered cooking steps |
| createdAt | Date | Creation timestamp |
| updatedAt | Date | Update timestamp |

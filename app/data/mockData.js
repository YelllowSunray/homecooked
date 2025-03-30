// Mock data for food offerings in different cities
export const mockFoodOfferings = {
  "hilversum": [
    { id: 1, name: "Dutch Apple", cook: "Maria", price: "€8.50", image: "/images/apple-pie.jpg" },
    { id: 2, name: "Homemade Stroopwafels", cook: "Jan", price: "€6.00", image: "/images/stroopwafels.jpg" },
    { id: 3, name: "Indonesian Rijsttafel", cook: "Indra", price: "€22.00", image: "/images/rijsttafel.jpg" },
  ],
  "rotterdam": [
    { id: 4, name: "Fresh Herring", cook: "Pieter", price: "€7.50", image: "/images/herring.jpg" },
    { id: 5, name: "Vegetarian Stamppot", cook: "Eva", price: "€10.00", image: "/images/stamppot.jpg" },
  ],
  "utrecht": [
    { id: 6, name: "Spiced Speculaas", cook: "Sophie", price: "€5.00", image: "/images/speculaas.jpg" },
    { id: 7, name: "Traditional Bitterballen", cook: "Thomas", price: "€8.00", image: "/images/bitterballen.jpg" },
  ],
  "eindhoven": [
    { id: 8, name: "Homemade Gouda Cheese", cook: "Lieke", price: "€12.00", image: "/images/gouda.jpg" },
    { id: 9, name: "Dutch Pancakes", cook: "Daan", price: "€9.50", image: "/images/pancakes.jpg" },
  ],
};

// Default offerings for when no city matches
export const defaultOfferings = [
  { id: 10, name: "Classic Poffertjes", cook: "Anna", price: "€7.00", image: "/images/poffertjes.jpg" },
  { id: 11, name: "Dutch Meatballs", cook: "Joris", price: "€11.00", image: "/images/meatballs.jpg" },
]; 
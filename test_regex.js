const text = "Исследование x^3 + y^2 = 0\nИсточник: https://en.wikipedia.org/wiki/Semicubical_parabola";
const urlRegex = /(https?:\/\/[^\s]+)/g;
const parts = text.split(urlRegex);
console.log(parts);

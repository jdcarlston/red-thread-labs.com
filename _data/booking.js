// Ways to book a 1:1 session, used by the "Choose where to start" section (partials/booking.njk).
// Change a link here and every page that shows it updates. Prices are set on each page,
// because the Level-Up and Become The Man pages show different rates.
//
//   calendly - where the person picks a time (no payment)
//   square   - a Square payment link; after paying, Square sends them on to book a time

module.exports = {
  consult: {
    name: "Preliminary Consult",
    length: "25 min",
    calendly: "https://calendly.com/jdcarlston/preliminary-consult",
  },
  levelUp: {
    name: "Level-Up Session",
    length: "2 hrs",
    onlineSquare: "https://square.link/u/wUjv26rI",
    inPersonCalendly: "https://calendly.com/jdcarlston/leve-up-session-in-person",
    inPersonWhere: "Draper, UT",
  },
};

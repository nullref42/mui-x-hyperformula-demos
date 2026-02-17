// Data using custom HyperFormula functions: DISCOUNT, MARKUP, TAX
// These are registered via BusinessFunctionsPlugin before HyperFormula.buildEmpty()

export const rowData = [
  {
    id: 1,
    name: 'Laptop Pro',
    year_1: 1200,
    year_2: '=DISCOUNT(B1, 15)',
    average: '=MARKUP(B1, 20)',
    sum: '=TAX(B1, 8.5)',
  },
  {
    id: 2,
    name: 'Wireless Mouse',
    year_1: 45,
    year_2: '=DISCOUNT(B2, 10)',
    average: '=MARKUP(B2, 30)',
    sum: '=TAX(B2, 8.5)',
  },
  {
    id: 3,
    name: 'USB-C Hub',
    year_1: 89.99,
    year_2: '=DISCOUNT(B3, 25)',
    average: '=MARKUP(B3, 15)',
    sum: '=TAX(B3, 8.5)',
  },
  {
    id: 4,
    name: 'Monitor 27"',
    year_1: 549,
    year_2: '=DISCOUNT(B4, 20)',
    average: '=MARKUP(B4, 10)',
    sum: '=TAX(B4, 8.5)',
  },
  {
    id: 5,
    name: 'Keyboard',
    year_1: 159,
    year_2: '=DISCOUNT(B5, 5)',
    average: '=MARKUP(B5, 25)',
    sum: '=TAX(B5, 8.5)',
  },
  {
    id: 6,
    name: 'Total',
    year_1: '=SUM(B1:B5)',
    year_2: '=SUM(C1:C5)',
    average: '=SUM(D1:D5)',
    sum: '=SUM(E1:E5)',
  },
];

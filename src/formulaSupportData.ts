// Data with formulas, large values, negative values, and a division-by-zero error
// for demonstrating conditional styling with HyperFormula's getCellType() API

export const rowData = [
  {
    id: 1,
    name: 'Greg Black',
    year_1: 145.50,
    year_2: '=B1*1.3',
    average: '=AVERAGE(B1:C1)',
    sum: '=SUM(B1:C1)',
  },
  {
    id: 2,
    name: 'Anne Carpenter',
    year_1: -12.30,
    year_2: '=$B$2*30%',
    average: '=AVERAGE(B2:C2)',
    sum: '=SUM(B2:C2)',
  },
  {
    id: 3,
    name: 'Natalie Dem',
    year_1: 3.59,
    year_2: '=B3*2.7+2+1',
    average: '=AVERAGE(B3:C3)',
    sum: '=SUM(B3:C3)',
  },
  {
    id: 4,
    name: 'John Sieg',
    year_1: 250.00,
    year_2: '=B4*(1.22+1)',
    average: '=AVERAGE(B4:C4)',
    sum: '=SUM(B4:C4)',
  },
  {
    id: 5,
    name: 'Chris Aklips',
    year_1: -45.20,
    year_2: '=B5/0',
    average: '=AVERAGE(B5:C5)',
    sum: '=SUM(B5:C5)',
  },
  {
    id: 6,
    name: 'Total',
    year_1: '=SUM(B1:B5)',
    year_2: '=SUM(C1:C5)',
    average: '=IF(SUM(D1:D5)>100, "Over 100", "Under 100")',
    sum: '=SUM(E1:E5)',
  },
];

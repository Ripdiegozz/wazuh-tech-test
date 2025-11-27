// Mock for @opensearch/datemath
module.exports = {
  parse: jest.fn(() => ({
    toDate: () => new Date(),
    isValid: () => true,
  })),
  unitsDesc: ['y', 'M', 'w', 'd', 'h', 'm', 's', 'ms'],
  units: ['y', 'M', 'w', 'd', 'h', 'm', 's', 'ms'],
};


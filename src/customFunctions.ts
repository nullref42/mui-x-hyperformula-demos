import HyperFormula, {
  FunctionPlugin,
  FunctionArgumentType,
} from 'hyperformula';

/**
 * Custom HyperFormula function plugin with business calculation functions:
 * - DISCOUNT(price, percent) → price reduced by percent
 * - MARKUP(cost, percent)    → cost increased by percent
 * - TAX(amount, rate)        → tax amount (amount × rate / 100)
 */
export class BusinessFunctionsPlugin extends FunctionPlugin {
  static implementedFunctions = {
    DISCOUNT: {
      method: 'discount',
      parameters: [
        { argumentType: FunctionArgumentType.NUMBER },
        { argumentType: FunctionArgumentType.NUMBER },
      ],
    },
    MARKUP: {
      method: 'markup',
      parameters: [
        { argumentType: FunctionArgumentType.NUMBER },
        { argumentType: FunctionArgumentType.NUMBER },
      ],
    },
    TAX: {
      method: 'tax',
      parameters: [
        { argumentType: FunctionArgumentType.NUMBER },
        { argumentType: FunctionArgumentType.NUMBER },
      ],
    },
  };

  discount(ast: any, state: any) {
    return this.runFunction(
      ast.args,
      state,
      this.metadata('DISCOUNT'),
      (price: number, percent: number) => price * (1 - percent / 100),
    );
  }

  markup(ast: any, state: any) {
    return this.runFunction(
      ast.args,
      state,
      this.metadata('MARKUP'),
      (cost: number, percent: number) => cost * (1 + percent / 100),
    );
  }

  tax(ast: any, state: any) {
    return this.runFunction(
      ast.args,
      state,
      this.metadata('TAX'),
      (amount: number, rate: number) => (amount * rate) / 100,
    );
  }
}

export const BusinessFunctionsTranslations = {
  enGB: {
    DISCOUNT: 'DISCOUNT',
    MARKUP: 'MARKUP',
    TAX: 'TAX',
  },
};

/**
 * Register all custom business functions with HyperFormula.
 * Must be called before HyperFormula.buildEmpty().
 */
export function registerCustomFunctions() {
  HyperFormula.registerFunctionPlugin(
    BusinessFunctionsPlugin,
    BusinessFunctionsTranslations,
  );
}

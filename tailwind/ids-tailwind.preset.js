const plugin = require('tailwindcss/plugin');
const smcReference = require('./smc-reference.js');

module.exports = {
  theme: {
    extend: {
      colors: {
        ...smcReference.colors,
      },
      spacing: {
        ...smcReference.spacing,
      },
      borderRadius: {
        ...smcReference.borderRadius,
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      const types = ['display', 'headline', 'title', 'body', 'caption'];
      const sizes = ['xlarge', 'large', 'medium', 'small'];

      const typographyConfig = (type, fontFamily, fontSize, lineHeight) => {
        return {
          [`.${type}`]: {
            '&-regular': {
              fontFamily: fontFamily,
              fontWeight: 'var(--ids-smc-reference-typography-font-weight-regular)',
              textTransform: 'none',
              textDecoration: 'none',
              fontSize: fontSize,
              lineHeight: lineHeight,
              letterSpacing: 0,
            },
            '&-semibold': {
              fontFamily: fontFamily,
              fontWeight: 'var(--ids-smc-reference-typography-font-weight-semibold)',
              textTransform: 'none',
              textDecoration: 'none',
              fontSize: fontSize || '1rem',
              lineHeight: lineHeight || '1rem',
              letterSpacing: 0,
            },
            '&-bold': {
              fontFamily: fontFamily,
              fontWeight: 'var(--ids-smc-reference-typography-font-weight-bold)',
              textTransform: 'none',
              textDecoration: 'none',
              fontSize: fontSize,
              lineHeight: lineHeight,
              letterSpacing: 0,
            },
          },
        };
      };

      let config = {};
      types.forEach((type) =>
        sizes.forEach((size) => {
          config = {
            ...config,
            ...typographyConfig(
              `${type}-${size}`,
              `var(--ids-smc-layout-typography-${type}-font-family-${size})`,
              `var(--ids-smc-layout-typography-${type}-font-size-${size})`,
              `var(--ids-smc-layout-typography-${type}-line-height-${size})`
            ),
          };
        })
      );
      addBase(config);
    }),
  ],
};

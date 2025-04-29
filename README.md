# i-DS tokens
This repository contains utility scripts, design token definitions and CSS variable collection for the i-Cell Design System, eg. Figma token JSON to CSS converter, etc.

## TailwindCSS (3.x) integration
Tailwind preset is generated and can be imported to parent project to extend the default config.
### Import
```
/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [
    require('./path/to/ids-tailwind.preset.js')
  ],
  // Customizations specific to this project would go here
  theme: {
    extend: {
      ...
    }
  },
}
```

### Usage
#### Typography
The following types, sizes and variants can be mixed to achieve the desired style (for detailed explanation check the design documentations):
* types: 'display', 'headline', 'title', 'body', 'caption'
* sizes: 'xlarge', 'large', 'medium', 'small'
* variants: 'regular', 'bold', 'semibold'

Examples: 
- 'display-large-semibold', 
- 'caption-xlarge-regular'

#### Utility classess
Color, spacing (gap, padding, width, etc.) and border radius classes can be used like it were generic tailwind classes, except the generated classes has `ids` prefix. 

Examples: 
- 'gap-ids-container-gap-32' (gap)
- 'text-ids-page-fg-surface-default' (text-color)
- 'bg-ids-container-bg-surface-darker-10' (background-color)
- 'rounded-ids-container-xs' (border-radius)
- 'px-ids-container-padding-8' (horizontal padding)


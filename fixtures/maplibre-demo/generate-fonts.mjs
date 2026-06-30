import { buildFonts } from '../../dist/index.js';

await buildFonts({
  output: './public/fonts',
  fontstacks: [
    {
      font: './fonts/RobotoFlex-VariableFont.ttf',
      fontstack: 'Roboto Flex Heading 1',
      ranges: 'latin',
      axes: {
        opsz: 28,
        slnt: -10,
        wdth: 28.1,
        wght: 388,
        GRAD: 4,
        XOPQ: 127,
        XTRA: 448,
        YOPQ: 43,
        YTAS: 832,
        YTDE: -211,
        YTFI: 738,
        YTLC: 453,
        YTUC: 760,
      },
    },
  ],
});

import katex from 'katex';
try {
  console.log(katex.renderToString('T(x \\text{ при } x=3)'));
} catch (e) {
  console.log(e);
}

# Autonomy-Techonologies — Study Pages

Self-contained HTML study guides and interactive labs, hosted with GitHub Pages.

**Live site:** https://unknown-x0.github.io/Autonomy-Techonologies/

## Pages

| Course | Page | Type |
| --- | --- | --- |
| Electrical Engineering 1 | [Electrostatic Fields](https://unknown-x0.github.io/Autonomy-Techonologies/ee1-electrostatics-guide.html) | Study guide |
| Electrical Engineering 1 | [Electrostatic Fields Lab](https://unknown-x0.github.io/Autonomy-Techonologies/ee1-electrostatics-lab.html) | Interactive lab |
| Mathematics for Engineers I | [Mathematics for Engineers I](https://unknown-x0.github.io/Autonomy-Techonologies/math1-guide.html) | Study guide |

Each study guide has a section menu, formulas, worked methods, 20 practice problems with a hidden answer key, and an exam checklist (ticks are saved in your browser).

## Files

```
index.html                      Hub page linking to every study page
ee1-electrostatics-guide.html   EE1 Chapter 1: Electrostatic Fields guide
ee1-electrostatics-lab.html     EE1 interactive field simulator
math1-guide.html                Mathematics for Engineers I guide
```

Every page is a single HTML file. Equations are pre-rendered with KaTeX; only fonts and the KaTeX stylesheet load from a CDN.

The two study guides are generated from the LaTeX sources in the claude.ai project **Focus - Classes** (`Electrostatics-Study-Guide.tex`, `MathEng-I-Study-Guide.tex`), converted with pandoc. When a guide changes there, regenerate the matching HTML page here.

## Colours

The pages use the FAU Erlangen-Nürnberg brand palette (colours only; no FAU logo):

| Use | Colour |
| --- | --- |
| Headings, header band, main accent | FAU blue `#04316A` (deep `#041E42`, links `#004A9F`, tint `#CED9E7`) |
| Electrical Engineering 1 | Technische Fakultät `#8C9FB1` (text `#2F586E`) |
| Mathematics for Engineers I | Naturwissenschaftliche Fakultät `#7BB725` (text `#266141`) |
| Lab: positive / negative charge | `#C50F3C` / `#004A9F` |

Faculty colours are used for stripes and swatches, with their darker shades for text, so contrast stays readable.

**Font:** Roboto (text and headings) and Roboto Mono (labels), FAU's web typeface, loaded from Google Fonts (Apache 2.0).

**Site mark:** an original icon (field lines between a + and a − charge) used in the header, side menu and as the favicon. It is not the FAU logo, which is a protected university trademark.

## Adding a new page

1. Upload the `.html` file to the repo root (**Add file → Upload files**). Prefer names without spaces, e.g. `ee1-chapter2-guide.html`.
2. In `index.html`, copy an existing `<a class="card …">` block and change the link, tag, name and description. Use class `ee` or `math` for the course colour, or add a new `<h2>` section for a new course.
3. Add a row to the table above.
4. Commit. The site updates within a minute or two.

## Hosting

GitHub Pages is set to deploy from the `main` branch, root folder (**Settings → Pages**). The repo must stay public for free Pages hosting.

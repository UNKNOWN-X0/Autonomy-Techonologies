# Study Pages

Study guides and interactive labs for first-semester engineering at FAU Erlangen-Nürnberg (WS 2026/27): Electrical Engineering 1 and Mathematics for Engineers I.

**[Open the site →](https://unknown-x0.github.io/Autonomy-Techonologies/)**

![Study Pages hub](assets/preview.png)

> Personal study material written from the lecture notes. Not an official FAU publication; check anything exam-relevant against your course materials.

## What's inside

| Course | Page | What it does |
| --- | --- | --- |
| Electrical Engineering 1 | [Electrostatic Fields: study guide](https://unknown-x0.github.io/Autonomy-Techonologies/ee1-electrostatics-guide.html) | Chapter 1 condensed (charge to capacitors and stored energy): key formulas, worked methods, 20 practice problems, exam checklist |
| Electrical Engineering 1 | [Electrostatic Fields Lab](https://unknown-x0.github.io/Autonomy-Techonologies/ee1-electrostatics-lab.html) | Drag charges and sliders to see Coulomb forces, field lines, potential maps, Gauss surfaces, interfaces and capacitor networks respond live |
| Mathematics for Engineers I | [Mathematics for Engineers I: study guide](https://unknown-x0.github.io/Autonomy-Techonologies/math1-guide.html) | Logic, real and complex numbers, vector spaces, matrices, eigenvalues, least squares; 20 practice problems, exam checklist |

## How to study with it

1. Read one section of a guide, then cover its formulas and write them out from memory.
2. Do the matching practice problems, then open **Show answer key** to check.
3. For electrostatics, try the same idea in the lab: change one input and predict the result before you look.
4. Tick the exam checklist as each skill sticks. Ticks are saved in your browser.

Every page works on phone and desktop and follows your system's light or dark mode. The study guides also print cleanly (the side menu is hidden in print).

## Repository layout

```
index.html                      Hub page linking to every study page
ee1-electrostatics-guide.html   EE1 Chapter 1 study guide
ee1-electrostatics-lab.html     EE1 interactive lab
math1-guide.html                Mathematics for Engineers I study guide
assets/preview.png              Screenshot used in this README
```

Each page is one self-contained HTML file with no build step needed to view it. Only the fonts and the KaTeX stylesheet load from a CDN.

## How the pages are made

- **Study guides** are written in LaTeX (`Electrostatics-Study-Guide.tex`, `MathEng-I-Study-Guide.tex`, kept in the claude.ai project *Focus - Classes*), converted to HTML with pandoc, and every formula is pre-rendered with KaTeX. That makes the pages large (about 0.9 MB each) but the math shows instantly, without JavaScript.
- **The lab** is a single page with its interactive code inline. Its source is kept in the same project.
- When a source changes, rebuild the matching page and upload it here.

## Design

- **Colours:** the FAU Erlangen-Nürnberg brand palette. FAU blue `#04316A` for headings and accents; faculty colours mark the courses: Technische Fakultät `#8C9FB1` for Electrical Engineering 1, Naturwissenschaftliche Fakultät `#7BB725` for Mathematics for Engineers I. Faculty colours appear as stripes and swatches, with their darker shades (`#2F586E`, `#266141`) for text, so contrast stays readable.
- **Font:** Roboto and Roboto Mono, FAU's web typeface (Apache 2.0, via Google Fonts).
- **Site mark:** an original icon (field lines between a + and a − charge). The FAU logo is not used; it is a protected university trademark.

## Adding a page

1. Upload the `.html` file to the repo root (**Add file → Upload files**). Use a name without spaces, e.g. `ee1-chapter2-guide.html`.
2. In `index.html`, copy an existing `<a class="card …">` block and change the link, tag, name and description. Class `tf` gives the Electrical Engineering colour, `nat` the Mathematics colour. For a new course, add a new `<h2>` section.
3. Add a row to the **What's inside** table above.
4. Commit. GitHub Pages updates the site within a minute or two.

## Hosting

GitHub Pages deploys from the `main` branch, root folder (**Settings → Pages**). The repository must stay public for free Pages hosting.

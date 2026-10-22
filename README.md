# Autonomy-Techonologies — Study Pages

Self-contained HTML study guides and interactive labs, hosted with GitHub Pages.

**Live site:** https://unknown-x0.github.io/Autonomy-Techonologies/

## Pages

| Course | Page | Type |
| --- | --- | --- |
| Electrical Engineering 1 | [Electrostatic Fields](https://unknown-x0.github.io/Autonomy-Techonologies/ee1-electrostatics-guide.html) | Study guide |
| Electrical Engineering 1 | [Electrostatic Fields Lab](https://unknown-x0.github.io/Autonomy-Techonologies/Electrostatic%20Fields%20Lab.html) | Interactive lab |
| Mathematics for Engineers I | [Mathematics for Engineers I](https://unknown-x0.github.io/Autonomy-Techonologies/math1-guide.html) | Study guide |

Each study guide has a section menu, formulas, worked methods, 20 practice problems with a hidden answer key, and an exam checklist (ticks are saved in your browser).

## Files

```
index.html                      Hub page linking to every study page
ee1-electrostatics-guide.html   EE1 Chapter 1: Electrostatic Fields guide
Electrostatic Fields Lab.html   EE1 interactive field simulator
math1-guide.html                Mathematics for Engineers I guide
```

Every page is a single HTML file with no build step. Equations are pre-rendered with KaTeX; only fonts and the KaTeX stylesheet load from a CDN.

## Adding a new page

1. Upload the `.html` file to the repo root (**Add file → Upload files**). Prefer names without spaces, e.g. `ee1-chapter2-guide.html`.
2. In `index.html`, copy an existing `<a class="card …">` block and change the link, tag, name and description. Use class `ee` or `math` for the course colour, or add a new `<h2>` section for a new course.
3. Add a row to the table above.
4. Commit. The site updates within a minute or two.

## Hosting

GitHub Pages is set to deploy from the `main` branch, root folder (**Settings → Pages**). The repo must stay public for free Pages hosting.

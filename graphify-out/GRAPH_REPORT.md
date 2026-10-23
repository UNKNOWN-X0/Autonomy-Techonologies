# Graph Report - AutonomyTechnologies  (2026-10-24)

## Corpus Check
- 12 files · ~189,660 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .css 5, (none) 1)

## Summary
- 244 nodes · 521 edges · 12 communities (8 shown, 4 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.85)
- Token cost: unavailable (agent usage metadata was not exposed)

## Community Hubs (Navigation)
- Mathematics Lab Code
- Electrostatics Lab Code
- Electrostatics Study Guide
- Complex Numbers and Functions
- Electrostatics Lab Topics
- GitHub Pages Workflow
- Course Home and Docs
- Engineering Mathematics Guide
- Math Utility Library
- Site Preview Artwork

## God Nodes (most connected - your core abstractions)
1. `Electrostatic fields lab` - 38 edges
2. `fmt()` - 21 edges
3. `drawPr()` - 17 edges
4. `drawCx()` - 15 edges
5. `drawMx()` - 15 edges
6. `fit()` - 14 edges
7. `rich()` - 14 edges
8. `all()` - 14 edges
9. `Electrostatic Fields study guide` - 14 edges
10. `gridAxes()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `Electrical Engineering I study cards` --references--> `Electrical Engineering I`  [EXTRACTED]
  index.html → README.md
- `Mathematics for Engineers I study cards` --references--> `Mathematics for Engineers I`  [EXTRACTED]
  index.html → README.md
- `Study Pages home page` --references--> `GitHub Pages hosting`  [EXTRACTED]
  index.html → README.md

## Import Cycles
- None detected.

## Communities (12 total, 4 thin omitted)

### Community 0 - "Mathematics Lab Code"
Cohesion: 0.13
Nodes (49): all(), angArc(), angStr(), argQ(), arrow(), charPoly(), cStr(), dot() (+41 more)

### Community 1 - "Electrostatics Lab Code"
Cohesion: 0.11
Nodes (45): all(), allDeps(), arrow(), buildGeoCtl(), buildInputs(), chargeDot(), Dcyl(), drawC() (+37 more)

### Community 2 - "Electrostatics Study Guide"
Cohesion: 0.11
Nodes (39): Bank account charge analogy, Capacitance and capacitor geometry, Capacitor stored energy, Conductor electrostatic induction and shielding, Coulomb inverse square force, Coulomb law lab, Crowd and seating polarization analogy, Dielectric interface conditions (+31 more)

### Community 3 - "Complex Numbers and Functions"
Cohesion: 0.07
Nodes (33): Absolute value, Complex arithmetic, conjugates, and modulus, Complex exponential, logarithm, sine, and cosine, Complex numbers, Complex polar form and operations, Cross product in three dimensions, Definiteness and quadratic forms, Determinants and Cramer rule (+25 more)

### Community 4 - "Electrostatics Lab Topics"
Cohesion: 0.26
Nodes (15): Capacitance and capacitor geometries, Series and parallel capacitor networks, Charge conservation and Coulomb law, Charge densities and field lines, Dielectric polarization, Electric field energy, Electric field strength, Electric flux density and Gauss law (+7 more)

### Community 5 - "GitHub Pages Workflow"
Cohesion: 0.14
Nodes (13): runs-on, steps, jobs, build, name, branches, branches, name (+5 more)

### Community 6 - "Course Home and Docs"
Cohesion: 0.20
Nodes (13): Electrical Engineering I study cards, Mathematics for Engineers I study cards, Study Pages home page, Active-recall study workflow, Electrical Engineering I, Electrostatic Fields interactive lab, Electrostatic Fields study guide, GitHub Pages hosting (+5 more)

### Community 7 - "Engineering Mathematics Guide"
Cohesion: 0.19
Nodes (13): Absolute-value inequalities, Bernoulli inequality by mathematical induction, Complex arithmetic in the Gaussian plane, Complex powers and roots by de Moivre's theorem, Injective, surjective, and bijective functions, Least-squares curve fitting, Linear systems and Gauss elimination, Mathematics for Engineers I Lab page (+5 more)

## Knowledge Gaps
- **36 isolated node(s):** `Active-recall study workflow`, `LaTeX, Pandoc, and KaTeX publishing pipeline`, `Jekyll site CI`, `Practice problems and exam checklist`, `Logic and sets` (+31 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 60 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Fr` connect `Math Utility Library` to `Mathematics Lab Code`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `Active-recall study workflow`, `LaTeX, Pandoc, and KaTeX publishing pipeline`, `Jekyll site CI` to the rest of the system?**
  _36 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Mathematics Lab Code` be split into smaller, more focused modules?**
  _Cohesion score 0.1328011611030479 - nodes in this community are weakly interconnected._
- **Should `Electrostatics Lab Code` be split into smaller, more focused modules?**
  _Cohesion score 0.1110204081632653 - nodes in this community are weakly interconnected._
- **Should `Electrostatics Study Guide` be split into smaller, more focused modules?**
  _Cohesion score 0.10661268556005399 - nodes in this community are weakly interconnected._
- **Should `Complex Numbers and Functions` be split into smaller, more focused modules?**
  _Cohesion score 0.06628787878787878 - nodes in this community are weakly interconnected._
- **Should `GitHub Pages Workflow` be split into smaller, more focused modules?**
  _Cohesion score 0.14285714285714285 - nodes in this community are weakly interconnected._
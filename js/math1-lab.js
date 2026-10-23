
      (() => {
        "use strict";
        /* ---------- tokens and shared helpers ---------- */
        // Read every colour and font from the CSS tokens; never hard-code them in JS.
        const css = (n) =>
          getComputedStyle(document.documentElement).getPropertyValue(n).trim();
        let C = {};
        const TOKENS = [
          "--bg",
          "--surface",
          "--ink",
          "--muted",
          "--line",
          "--hl",
          "--pos",
          "--neg",
          "--force",
          "--field",
          "--f-display",
          "--f-body",
          "--f-mono",
        ];
        const readTokens = () =>
          TOKENS.forEach((n) => (C[n.slice(2)] = css(n)));
        const $ = (id) => document.getElementById(id);
        const PI = Math.PI,
          TAU = 2 * Math.PI;
        const mono = (px, wt) =>
          (wt ? wt + " " : "") + px + "px " + C["f-mono"];
        const serif = (px) => "italic " + px + "px " + C["f-body"];
        const gcd = (a, b) => {
          a = Math.abs(a);
          b = Math.abs(b);
          while (b) {
            [a, b] = [b, a % b];
          }
          return a || 1;
        };
        const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
        const snap = (v, s) => Math.round(v / s) * s;

        function fmt(v, d) {
          d = d === undefined ? 2 : d;
          if (!isFinite(v)) return v > 0 ? "∞" : v < 0 ? "−∞" : "—";
          if (Math.abs(v) < 5 * Math.pow(10, -(d + 1))) v = 0;
          return String(+v.toFixed(d)).replace("-", "−");
        }
        function piStr(phi) {
          const q = phi / PI;
          for (const d of [1, 2, 3, 4, 6, 12]) {
            const k = Math.round(q * d);
            if (Math.abs(q - k / d) < 1e-6) {
              if (k === 0) return "0";
              const g = gcd(k, d),
                kk = k / g,
                dd = d / g;
              const num =
                (kk === 1
                  ? ""
                  : kk === -1
                    ? "−"
                    : String(kk).replace("-", "−")) + "π";
              return dd === 1 ? num : num + "/" + dd;
            }
          }
          return fmt(phi, 3);
        }
        function angStr(phi) {
          if (isNaN(phi)) return "undefined";
          const p = piStr(phi);
          return (
            (p.includes("π") || p === "0" ? p : p + " rad") +
            " = " +
            fmt((phi * 180) / PI, 1) +
            "°"
          );
        }
        function rStr(r) {
          const s = r * r,
            n = Math.round(s);
          if (Math.abs(s - n) < 1e-6 && n < 400 && n > 0) {
            const q = Math.round(Math.sqrt(n));
            if (q * q === n) return String(q);
            let out = 1,
              rest = n;
            for (let f = 2; f * f <= rest; f++)
              while (rest % (f * f) === 0) {
                out *= f;
                rest /= f * f;
              }
            return (out > 1 ? out : "") + "√" + rest + " ≈ " + fmt(r, 3);
          }
          return fmt(r, 3);
        }
        function cStr(re, im, d) {
          d = d === undefined ? 2 : d;
          const tiny = 5 * Math.pow(10, -(d + 1));
          const R = fmt(re, d),
            I = fmt(Math.abs(im), d);
          if (Math.abs(im) < tiny) return R;
          const ip = (I === "1" ? "" : I) + "i";
          if (Math.abs(re) < tiny) return (im < 0 ? "−" : "") + ip;
          return R + (im < 0 ? " − " : " + ") + ip;
        }
        const sub = (n) => "<sub>" + n + "</sub>";
        const SUPD = "⁰¹²³⁴⁵⁶⁷⁸⁹";
        const supU = (n) =>
          String(n)
            .split("")
            .map((c) => SUPD[+c])
            .join("");

        function fit(cv, aspect, maxH) {
          const w =
            cv.clientWidth ||
            (cv.parentElement && cv.parentElement.clientWidth) ||
            600;
          if (w < 480) aspect *= 1.3; // taller canvases on phones
          let h = Math.round(w * aspect);
          if (maxH) h = Math.min(h, maxH);
          const dpr = window.devicePixelRatio || 1;
          cv.style.height = h + "px";
          cv.width = Math.round(w * dpr);
          cv.height = Math.round(h * dpr);
          const ctx = cv.getContext("2d");
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          ctx.fillStyle = C.surface;
          ctx.fillRect(0, 0, w, h);
          return { ctx, w, h };
        }
        function plane(w, h, cx, cy, ux, uy) {
          uy = uy || ux;
          const v = {
            w,
            h,
            ux,
            uy,
            unit: ux,
            X: (x) => w / 2 + (x - cx) * ux,
            Y: (y) => h / 2 - (y - cy) * uy,
            ix: (px) => (px - w / 2) / ux + cx,
            iy: (py) => cy - (py - h / 2) / uy,
          };
          v.x0 = v.ix(0);
          v.x1 = v.ix(w);
          v.y0 = v.iy(h);
          v.y1 = v.iy(0);
          return v;
        }
        const eqView = (w, h, cx, cy, halfW) =>
          plane(w, h, cx, cy, w / (2 * halfW));
        const boxView = (w, h, x0, x1, y0, y1) =>
          plane(
            w,
            h,
            (x0 + x1) / 2,
            (y0 + y1) / 2,
            w / (x1 - x0),
            h / (y1 - y0),
          );
        function niceStep(raw) {
          const p = Math.pow(10, Math.floor(Math.log10(raw))),
            m = raw / p;
          return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
        }
        function gridAxes(ctx, v, o) {
          o = o || {};
          const w = v.w,
            h = v.h;
          const sx = o.sx && o.sx * v.ux >= 22 ? o.sx : niceStep(44 / v.ux),
            sy = o.sy && o.sy * v.uy >= 22 ? o.sy : niceStep(34 / v.uy);
          ctx.lineWidth = 1;
          ctx.strokeStyle = C.line;
          ctx.beginPath();
          for (let i = Math.ceil(v.x0 / sx); i * sx <= v.x1; i++) {
            const X = Math.round(v.X(i * sx)) + 0.5;
            ctx.moveTo(X, 0);
            ctx.lineTo(X, h);
          }
          for (let i = Math.ceil(v.y0 / sy); i * sy <= v.y1; i++) {
            const Y = Math.round(v.Y(i * sy)) + 0.5;
            ctx.moveTo(0, Y);
            ctx.lineTo(w, Y);
          }
          ctx.stroke();
          const ax = v.X(0),
            ay = v.Y(0);
          ctx.strokeStyle = C.muted;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          if (ay >= 0 && ay <= h) {
            ctx.moveTo(0, ay);
            ctx.lineTo(w, ay);
          }
          if (ax >= 0 && ax <= w) {
            ctx.moveTo(ax, 0);
            ctx.lineTo(ax, h);
          }
          ctx.stroke();
          ctx.fillStyle = C.muted;
          ctx.font = mono(10);
          const ly = clamp(ay + 13, 12, h - 4),
            lx = clamp(ax - 4, 24, w - 4);
          ctx.textAlign = "center";
          for (let i = Math.ceil(v.x0 / sx); i * sx <= v.x1; i++) {
            if (i === 0) continue;
            const X = v.X(i * sx);
            if (X < 12 || X > w - 12) continue;
            ctx.fillText(fmt(i * sx), X, ly);
          }
          ctx.textAlign = "right";
          for (let i = Math.ceil(v.y0 / sy); i * sy <= v.y1; i++) {
            if (i === 0) continue;
            const Y = v.Y(i * sy);
            if (Y < 10 || Y > h - 8) continue;
            ctx.fillText(fmt(i * sy), lx, Y + 3);
          }
          ctx.fillStyle = C.ink;
          ctx.font = serif(14);
          if (o.xl) {
            ctx.textAlign = "right";
            ctx.fillText(o.xl, w - 6, clamp(ay - 6, 14, h - 4));
          }
          if (o.yl) {
            ctx.textAlign = "left";
            ctx.fillText(o.yl, clamp(ax + 6, 4, w - 40), 16);
          }
        }
        function arrow(ctx, x1, y1, x2, y2, col, lw, head) {
          lw = lw || 2.5;
          head = head || 9;
          const dx = x2 - x1,
            dy = y2 - y1,
            L = Math.hypot(dx, dy);
          if (L < 1) return;
          const ux = dx / L,
            uy = dy / L,
            hh = Math.min(head, L * 0.6);
          ctx.strokeStyle = col;
          ctx.fillStyle = col;
          ctx.lineWidth = lw;
          ctx.lineCap = "round";
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2 - ux * hh * 0.8, y2 - uy * hh * 0.8);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(
            x2 - ux * hh - uy * hh * 0.5,
            y2 - uy * hh + ux * hh * 0.5,
          );
          ctx.lineTo(
            x2 - ux * hh + uy * hh * 0.5,
            y2 - uy * hh - ux * hh * 0.5,
          );
          ctx.closePath();
          ctx.fill();
        }
        function dot(ctx, x, y, r, fill, stroke) {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, TAU);
          if (fill) {
            ctx.fillStyle = fill;
            ctx.fill();
          }
          if (stroke) {
            ctx.strokeStyle = stroke;
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }
        function seg(ctx, x1, y1, x2, y2, col, lw, dash) {
          ctx.save();
          ctx.strokeStyle = col;
          ctx.lineWidth = lw || 1.5;
          ctx.setLineDash(dash || []);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          ctx.restore();
        }
        function txt(ctx, s, x, y, col, font, align) {
          ctx.save();
          ctx.font = font;
          ctx.textAlign = align || "left";
          ctx.lineJoin = "round";
          ctx.strokeStyle = C.surface;
          ctx.lineWidth = 3.5;
          ctx.strokeText(s, x, y);
          ctx.fillStyle = col;
          ctx.fillText(s, x, y);
          ctx.restore();
        }
        const _c = document.createElement("canvas");
        _c.width = _c.height = 1;
        const _x = _c.getContext("2d", { willReadFrequently: true });
        function toRgb(col) {
          _x.clearRect(0, 0, 1, 1);
          _x.fillStyle = col;
          _x.fillRect(0, 0, 1, 1);
          const d = _x.getImageData(0, 0, 1, 1).data;
          return [d[0], d[1], d[2]];
        }

        function drag(cv, getPts, onMove, o) {
          o = o || {};
          let active = -1;
          const R = o.r || 26;
          const pos = (e) => {
            const r = cv.getBoundingClientRect();
            return { x: e.clientX - r.left, y: e.clientY - r.top };
          };
          cv.addEventListener("pointerdown", (e) => {
            const p = pos(e);
            let best = -1,
              bd = R;
            getPts().forEach((q, i) => {
              const d = Math.hypot(q.x - p.x, q.y - p.y);
              if (d < bd) {
                bd = d;
                best = i;
              }
            });
            if (best >= 0) {
              active = best;
              cv.setPointerCapture(e.pointerId);
              cv.style.cursor = "grabbing";
              e.preventDefault();
              if (o.start) o.start(best);
            }
          });
          cv.addEventListener("pointermove", (e) => {
            const p = pos(e);
            if (active >= 0) onMove(active, p);
            else
              cv.style.cursor = getPts().some(
                (q) => Math.hypot(q.x - p.x, q.y - p.y) < R,
              )
                ? "grab"
                : "default";
          });
          const end = () => {
            if (active >= 0) {
              active = -1;
              cv.style.cursor = "default";
              if (o.end) o.end();
            }
          };
          cv.addEventListener("pointerup", end);
          cv.addEventListener("pointercancel", end);
        }
        function segButtons(id, attr, onPick) {
          const g = $(id);
          g.querySelectorAll("button").forEach((b) =>
            b.addEventListener("click", () => {
              g.querySelectorAll("button").forEach((x) =>
                x.setAttribute("aria-pressed", String(x === b)),
              );
              onPick(b.dataset[attr], b);
            }),
          );
        }
        const setSeg = (id, attr, val) =>
          $(id)
            .querySelectorAll("button")
            .forEach((b) =>
              b.setAttribute("aria-pressed", String(b.dataset[attr] === val)),
            );
        const clearSeg = (id) =>
          $(id)
            .querySelectorAll("button")
            .forEach((b) => b.setAttribute("aria-pressed", "false"));
        function toggle(id, init, onChange) {
          const b = $(id);
          let on = init;
          b.setAttribute("aria-pressed", String(on));
          b.addEventListener("click", () => {
            on = !on;
            b.setAttribute("aria-pressed", String(on));
            onChange(on);
          });
          return {
            get: () => on,
            set: (x) => {
              on = x;
              b.setAttribute("aria-pressed", String(on));
            },
          };
        }
        function matHTML(M, nCoef, o) {
          o = o || {};
          let h = '<table class="mat' + (o.br ? " br" : "") + '">';
          if (o.heads)
            h +=
              "<tr>" +
              o.heads
                .map(
                  (t, j) =>
                    '<th class="' +
                    (j === nCoef ? "rhs" : "") +
                    '">' +
                    t +
                    "</th>",
                )
                .join("") +
              "</tr>";
          M.forEach((r, i) => {
            const cls =
              (o.rows && o.rows.includes(i) ? "chg" : "") +
              (o.bad === i ? " bad" : "");
            h +=
              '<tr class="' +
              cls +
              '">' +
              r
                .map((c, j) => {
                  const piv =
                    o.piv && o.piv.some((p) => p[0] === i && p[1] === j);
                  return (
                    '<td class="' +
                    (j === nCoef ? "rhs" : "") +
                    (piv ? " piv" : "") +
                    '">' +
                    (typeof c === "number"
                      ? fmt(c, o.d === undefined ? 2 : o.d)
                      : c) +
                    "</td>"
                  );
                })
                .join("") +
              "</tr>";
          });
          return h + "</table>";
        }

        /* ================= Part 1: logic and sets ================= */
        const EX = {
          and: { t: "A ∧ B", s: "A ∩ B", f: (a, b) => a && b },
          or: { t: "A ∨ B", s: "A ∪ B", f: (a, b) => a || b },
          xor: {
            t: "(A ∨ B) ∧ ¬(A ∧ B)",
            s: "either A or B, not both",
            f: (a, b) => a !== b,
          },
          notA: { t: "¬A", s: "Aᶜ", f: (a) => !a },
          imp: { t: "A ⇒ B", s: "Aᶜ ∪ B", f: (a, b) => !a || b },
          nAorB: { t: "¬A ∨ B", s: "Aᶜ ∪ B", f: (a, b) => !a || b },
          contra: { t: "¬B ⇒ ¬A", s: "B ∪ Aᶜ", f: (a, b) => b || !a },
          conv: { t: "B ⇒ A", s: "Bᶜ ∪ A", f: (a, b) => !b || a },
          iff: { t: "A ⇔ B", s: "(A ∩ B) ∪ (Aᶜ ∩ Bᶜ)", f: (a, b) => a === b },
          nand: { t: "¬(A ∧ B)", s: "(A ∩ B)ᶜ", f: (a, b) => !(a && b) },
          dm1: { t: "¬A ∨ ¬B", s: "Aᶜ ∪ Bᶜ", f: (a, b) => !a || !b },
          nor: { t: "¬(A ∨ B)", s: "(A ∪ B)ᶜ", f: (a, b) => !(a || b) },
          dm2: { t: "¬A ∧ ¬B", s: "Aᶜ ∩ Bᶜ", f: (a, b) => !a && !b },
          diff: { t: "A ∧ ¬B", s: "A \\ B", f: (a, b) => a && !b },
          contr: { t: "¬(A ∧ ¬B)", s: "(A \\ B)ᶜ", f: (a, b) => !(a && !b) },
        };
        const ROWS = [
          [1, 1],
          [1, 0],
          [0, 1],
          [0, 0],
        ];
        const lgL = $("lgL"),
          lgR = $("lgR"),
          cvLg = $("cvLg");
        Object.keys(EX).forEach((k) =>
          [lgL, lgR].forEach((s) => {
            const o = document.createElement("option");
            o.value = k;
            o.textContent = EX[k].t + "   ·   " + EX[k].s;
            s.appendChild(o);
          }),
        );
        lgL.value = "nand";
        lgR.value = "dm1";
        let lgHl = -1,
          lgGeo = [];
        segButtons("lgPre", "k", (k) => {
          const [l, r] = k.split(",");
          lgL.value = l;
          lgR.value = r;
          lgHl = -1;
          drawLg();
        });
        [lgL, lgR].forEach((s) =>
          s.addEventListener("change", () => {
            clearSeg("lgPre");
            drawLg();
          }),
        );
        const offV = document.createElement("canvas");
        function vennPanel(ctx, ox, pw, ph, f, title) {
          const ux = ox + 8,
            uy = 26,
            uw = pw - 16,
            uh = ph - 32;
          const r = Math.min(uw * 0.23, uh * 0.42),
            cy = uy + uh / 2,
            ca = ox + pw / 2 - r * 0.6,
            cb = ox + pw / 2 + r * 0.6;
          const cell = 2,
            gw = Math.max(1, Math.ceil(uw / cell)),
            gh = Math.max(1, Math.ceil(uh / cell));
          offV.width = gw;
          offV.height = gh;
          const o = offV.getContext("2d"),
            img = o.createImageData(gw, gh),
            fc = toRgb(C.force),
            ic = toRgb(C.ink);
          for (let j = 0; j < gh; j++)
            for (let i = 0; i < gw; i++) {
              const x = ux + (i + 0.5) * cell,
                y = uy + (j + 0.5) * cell;
              const a = Math.hypot(x - ca, y - cy) < r,
                b = Math.hypot(x - cb, y - cy) < r;
              const on = f(a, b),
                hl = lgHl >= 0 && ROWS[lgHl][0] === +a && ROWS[lgHl][1] === +b,
                k = (j * gw + i) * 4;
              let col = fc,
                al = 0;
              if (on && hl) {
                col = fc.map((v, q) => v * 0.65 + ic[q] * 0.35);
                al = 190;
              } else if (on) al = 105;
              else if (hl) {
                col = ic;
                al = 45;
              }
              img.data[k] = col[0];
              img.data[k + 1] = col[1];
              img.data[k + 2] = col[2];
              img.data[k + 3] = al;
            }
          o.putImageData(img, 0, 0);
          ctx.save();
          ctx.beginPath();
          ctx.rect(ux, uy, uw, uh);
          ctx.clip();
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(offV, ux, uy, gw * cell, gh * cell);
          ctx.restore();
          ctx.strokeStyle = C.ink;
          ctx.lineWidth = 1.2;
          ctx.strokeRect(ux + 0.5, uy + 0.5, uw - 1, uh - 1);
          ctx.lineWidth = 1.6;
          [ca, cb].forEach((cx) => {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, TAU);
            ctx.stroke();
          });
          txt(
            ctx,
            "A",
            ca - r * 0.75,
            cy - r * 0.62,
            C.ink,
            serif(15),
            "center",
          );
          txt(
            ctx,
            "B",
            cb + r * 0.75,
            cy - r * 0.62,
            C.ink,
            serif(15),
            "center",
          );
          txt(ctx, "X", ux + uw - 8, uy + uh - 8, C.muted, serif(13), "right");
          txt(
            ctx,
            title,
            ox + pw / 2,
            17,
            C.ink,
            mono(pw < 230 ? 11 : 12, "600"),
            "center",
          );
          lgGeo.push({ ux, uy, uw, uh, ca, cb, cy, r });
        }
        function drawVenn() {
          const L = EX[lgL.value],
            R = EX[lgR.value];
          const { ctx, w, h } = fit(cvLg, 0.4, 320);
          lgGeo = [];
          vennPanel(ctx, 0, w / 2, h, L.f, L.t);
          vennPanel(ctx, w / 2, w / 2, h, R.f, R.t);
          seg(ctx, w / 2, 8, w / 2, h - 8, C.line, 1);
        }
        function markLgRow() {
          $("tbLg")
            .querySelectorAll("tr[data-i]")
            .forEach((tr) =>
              tr.classList.toggle("cur", +tr.dataset.i === lgHl),
            );
        }
        function drawLg() {
          drawVenn();
          const L = EX[lgL.value],
            R = EX[lgR.value];
          let h =
            '<tr><th>A</th><th>B</th><th>Left<span class="tsub">' +
            L.t +
            '</span></th><th>Right<span class="tsub">' +
            R.t +
            "</span></th><th>Left ⇔ Right</th></tr>";
          const diffs = [];
          ROWS.forEach(([a, b], i) => {
            const l = +L.f(!!a, !!b),
              r = +R.f(!!a, !!b),
              e = +(l === r);
            if (!e) diffs.push(i);
            h +=
              '<tr data-i="' +
              i +
              '"><td>' +
              a +
              "</td><td>" +
              b +
              '</td><td class="' +
              (e ? "" : "diff") +
              '">' +
              l +
              '</td><td class="' +
              (e ? "" : "diff") +
              '">' +
              r +
              "</td><td>" +
              e +
              "</td></tr>";
          });
          $("tbLg").innerHTML = h;
          $("tbLg")
            .querySelectorAll("tr[data-i]")
            .forEach((tr) => {
              tr.addEventListener("pointerenter", () => {
                lgHl = +tr.dataset.i;
                drawVenn();
                markLgRow();
              });
              tr.addEventListener("pointerleave", () => {
                lgHl = -1;
                drawVenn();
                markLgRow();
              });
            });
          markLgRow();
          $("lgV").textContent = !diffs.length
            ? "Equivalent: Left ⇔ Right is 1 in every row, a tautology. The two diagrams are shaded identically."
            : "Not equivalent: they differ where " +
              diffs
                .map((i) => "A = " + ROWS[i][0] + ", B = " + ROWS[i][1])
                .join(" and where ") +
              ".";
        }
        function lgHit(e) {
          const r = cvLg.getBoundingClientRect(),
            x = e.clientX - r.left,
            y = e.clientY - r.top;
          let idx = -1;
          lgGeo.forEach((g) => {
            if (
              x >= g.ux &&
              x <= g.ux + g.uw &&
              y >= g.uy &&
              y <= g.uy + g.uh
            ) {
              const a = +(Math.hypot(x - g.ca, y - g.cy) < g.r),
                b = +(Math.hypot(x - g.cb, y - g.cy) < g.r);
              idx = ROWS.findIndex((q) => q[0] === a && q[1] === b);
            }
          });
          if (idx !== lgHl) {
            lgHl = idx;
            drawVenn();
            markLgRow();
          }
        }
        cvLg.addEventListener("pointermove", lgHit);
        cvLg.addEventListener("pointerdown", lgHit);
        cvLg.addEventListener("pointerleave", () => {
          if (lgHl >= 0) {
            lgHl = -1;
            drawVenn();
            markLgRow();
          }
        });

        /* ================= Part 2: absolute-value inequalities ================= */
        const abM = $("abM"),
          abC = $("abC"),
          abR = $("abR"),
          cvAb = $("cvAb");
        let abRel = "le";
        const REL = { lt: "<", le: "≤", gt: ">", ge: "≥" };
        segButtons("abRel", "r", (r) => {
          abRel = r;
          drawAb();
        });
        [abM, abC, abR].forEach((x) => x.addEventListener("input", drawAb));
        function linStr(m, c, v) {
          v = v || "x";
          let s = m === 0 ? "" : m === 1 ? v : m === -1 ? "−" + v : fmt(m) + v;
          if (c > 0) s += (s ? " + " : "") + fmt(c);
          else if (c < 0) s += (s ? " − " : "−") + fmt(-c);
          return s || "0";
        }
        function solveAbs(m, c, r, rel) {
          const ALL = { lo: -Infinity, hi: Infinity, lc: false, hc: false };
          const strict = rel === "lt" || rel === "gt",
            below = rel === "lt" || rel === "le";
          if (m === 0) {
            const u = Math.abs(c);
            const ok =
              rel === "lt"
                ? u < r
                : rel === "le"
                  ? u <= r
                  : rel === "gt"
                    ? u > r
                    : u >= r;
            return ok ? [ALL] : [];
          }
          const p = (-r - c) / m,
            q = (r - c) / m,
            lo = Math.min(p, q),
            hi = Math.max(p, q);
          if (below) {
            if (r < 0 || (r === 0 && strict)) return [];
            return [{ lo, hi, lc: !strict, hc: !strict }];
          }
          if (r < 0 || (r === 0 && !strict)) return [ALL];
          return [
            { lo: -Infinity, hi: lo, lc: false, hc: !strict },
            { lo: hi, hi: Infinity, lc: !strict, hc: false },
          ];
        }
        function ivStr(ivs) {
          if (!ivs.length) return "∅ (no x)";
          return ivs
            .map((iv) => {
              if (iv.lo === -Infinity && iv.hi === Infinity)
                return "ℝ (every x)";
              if (iv.lo === iv.hi) return "{" + fmt(iv.lo) + "}";
              return (
                (iv.lc ? "[" : "(") +
                fmt(iv.lo) +
                ", " +
                fmt(iv.hi) +
                (iv.hc ? "]" : ")")
              );
            })
            .join(" ∪ ");
        }
        function drawAb() {
          const m = +abM.value,
            c = +abC.value,
            r = +abR.value,
            rel = REL[abRel];
          $("abMv").textContent = fmt(m);
          $("abCv").textContent = fmt(c);
          $("abRv").textContent = fmt(r);
          const { ctx, w, h } = fit(cvAb, 0.5, 340),
            v = boxView(w, h, -9, 9, -1.6, 9.5);
          const ivs = solveAbs(m, c, r, abRel);
          ctx.save();
          ctx.globalAlpha = 0.75;
          ctx.fillStyle = C.hl;
          ivs.forEach((iv) => {
            const a = Math.max(iv.lo, v.x0),
              b = Math.min(iv.hi, v.x1);
            if (b >= a)
              ctx.fillRect(
                v.X(a) - (a === b ? 1.5 : 0),
                0,
                Math.max(3, v.X(b) - v.X(a)),
                h,
              );
          });
          ctx.restore();
          gridAxes(ctx, v, { xl: "x", yl: "y", sx: 1, sy: 1 });
          if (r >= v.y0 && r <= v.y1) {
            seg(ctx, 0, v.Y(r), w, v.Y(r), C.neg, 2);
            txt(
              ctx,
              "y = " + fmt(r),
              w - 8,
              v.Y(r) - 7,
              C.neg,
              mono(12, "600"),
              "right",
            );
          }
          const xs = [v.x0];
          let k = null;
          if (m !== 0) {
            k = -c / m;
            if (k > v.x0 && k < v.x1) xs.push(k);
          }
          xs.push(v.x1);
          ctx.strokeStyle = C.field;
          ctx.lineWidth = 2.8;
          ctx.lineJoin = "round";
          ctx.beginPath();
          xs.forEach((x, i) => {
            const y = Math.abs(m * x + c);
            i ? ctx.lineTo(v.X(x), v.Y(y)) : ctx.moveTo(v.X(x), v.Y(y));
          });
          ctx.stroke();
          txt(
            ctx,
            "y = |" + linStr(m, c) + "|",
            10,
            34,
            C.field,
            mono(12, "600"),
          );
          if (k !== null && k > v.x0 && k < v.x1) {
            seg(ctx, v.X(k), v.Y(0), v.X(k), 44, C.muted, 1, [3, 4]);
            txt(ctx, "kink", v.X(k) + 4, 54, C.muted, mono(11));
          }
          const y0 = v.Y(0);
          ctx.save();
          ctx.strokeStyle = C.force;
          ctx.lineWidth = 6;
          ctx.lineCap = "butt";
          ivs.forEach((iv) => {
            const a = Math.max(iv.lo, v.x0),
              b = Math.min(iv.hi, v.x1);
            if (b > a) {
              ctx.beginPath();
              ctx.moveTo(v.X(a), y0);
              ctx.lineTo(v.X(b), y0);
              ctx.stroke();
            }
          });
          ctx.restore();
          ivs.forEach((iv) =>
            [
              [iv.lo, iv.lc],
              [iv.hi, iv.hc],
            ].forEach(([x, cl]) => {
              if (!isFinite(x) || x < v.x0 || x > v.x1) return;
              dot(ctx, v.X(x), y0, 5.5, cl ? C.force : C.surface, C.force);
            }),
          );
          const below = abRel === "lt" || abRel === "le";
          $("abF").innerHTML =
            "|" +
            linStr(m, c) +
            "| " +
            rel +
            " " +
            fmt(r) +
            '<span class="fnote">Read: the value ' +
            linStr(m, c) +
            " lies " +
            (below
              ? abRel === "lt"
                ? "closer than "
                : "within "
              : abRel === "gt"
                ? "further than "
                : "at least ") +
            fmt(r) +
            " from 0.</span>";
          let html =
            '<div class="wide"><span>solution set</span><b>' +
            ivStr(ivs) +
            "</b></div>";
          if (m !== 0) {
            if (r >= 0)
              html +=
                "<div><span>boundaries: " +
                linStr(m, c) +
                " = ±" +
                fmt(r) +
                "</span><b>x = " +
                fmt((-r - c) / m) +
                " and x = " +
                fmt((r - c) / m) +
                "</b></div>";
            html +=
              "<div><span>kink: " +
              linStr(m, c) +
              " = 0</span><b>x = " +
              fmt(k) +
              "</b></div>";
            html +=
              "<div><span>as a distance from " +
              fmt(k) +
              "</span><b>|" +
              linStr(1, -k) +
              "| " +
              rel +
              " " +
              fmt(r / Math.abs(m)) +
              "</b></div>";
          } else {
            html +=
              "<div><span>m = 0: no x left</span><b>|" +
              fmt(c) +
              "| " +
              rel +
              " " +
              fmt(r) +
              " is " +
              (ivs.length ? "true" : "false") +
              "</b></div>";
          }
          $("roAb").innerHTML = html;
        }

        /* ================= Part 3: Bernoulli ================= */
        const bnN = $("bnN"),
          bnX = $("bnX"),
          cvBn = $("cvBn");
        [bnN, bnX].forEach((x) => x.addEventListener("input", drawBn));
        function drawBn() {
          const n = +bnN.value,
            x = +bnX.value;
          $("bnNv").textContent = n;
          $("bnXv").textContent = fmt(x);
          const { ctx, w, h } = fit(cvBn, 0.55, 360),
            v = boxView(w, h, -3.7, 1.7, -11, 13);
          const Lf = (t) => Math.pow(1 + t, n),
            Rf = (t) => 1 + n * t,
            N = 600;
          const cy = (val) => v.Y(clamp(val, v.y0 - 2, v.y1 + 2));
          ctx.save();
          ctx.globalAlpha = 0.16;
          ctx.fillStyle = C.pos;
          let st = null;
          for (let i = 0; i <= N; i++) {
            const t = v.x0 + ((v.x1 - v.x0) * i) / N,
              bad = Lf(t) < Rf(t) - 1e-9;
            if (bad && st === null) st = t;
            if ((!bad || i === N) && st !== null) {
              ctx.fillRect(v.X(st), 0, v.X(t) - v.X(st), h);
              st = null;
            }
          }
          ctx.restore();
          gridAxes(ctx, v, { xl: "x", yl: "y", sx: 1, sy: 5 });
          [
            [-1, "x = −1"],
            [-2, "x = −2"],
          ].forEach(([t, l]) => {
            seg(ctx, v.X(t), 0, v.X(t), h, C.muted, 1.2, [5, 4]);
            txt(ctx, l, v.X(t) + 4, 14, C.muted, mono(11));
          });
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, w, h);
          ctx.clip();
          ctx.strokeStyle = C.field;
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          for (let i = 0; i <= N; i++) {
            const t = v.x0 + ((v.x1 - v.x0) * i) / N;
            i ? ctx.lineTo(v.X(t), cy(Lf(t))) : ctx.moveTo(v.X(t), cy(Lf(t)));
          }
          ctx.stroke();
          ctx.strokeStyle = C.neg;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(v.X(v.x0), cy(Rf(v.x0)));
          ctx.lineTo(v.X(v.x1), cy(Rf(v.x1)));
          ctx.stroke();
          ctx.restore();
          txt(
            ctx,
            "curve (1 + x)" + supU(n),
            10,
            h - 26,
            C.field,
            mono(12, "600"),
          );
          txt(ctx, "line 1 + " + n + "x", 10, h - 10, C.neg, mono(12, "600"));
          const a = Lf(x),
            b = Rf(x),
            ok = a >= b - 1e-9;
          seg(ctx, v.X(x), cy(a), v.X(x), cy(b), ok ? C.force : C.pos, 3);
          dot(ctx, v.X(x), cy(a), 5, C.field);
          dot(ctx, v.X(x), cy(b), 5, C.neg);
          let dom = "";
          for (let k = 1; k <= n; k++) {
            const okk = Math.pow(1 + x, k) >= 1 + k * x - 1e-9;
            dom +=
              '<span class="' +
              (okk ? "ok" : "no") +
              '" title="n = ' +
              k +
              '">' +
              k +
              "</span>";
          }
          $("bnDom").innerHTML = dom;
          $("roBn").innerHTML =
            "<div><span>(1 + x)<sup>n</sup></span><b>" +
            fmt(a, 3) +
            "</b></div>" +
            "<div><span>1 + nx</span><b>" +
            fmt(b, 3) +
            "</b></div>" +
            "<div><span>difference</span><b>" +
            fmt(a - b, 3) +
            "</b></div>" +
            "<div><span>at this x and n</span><b>" +
            (ok ? "holds" : "fails") +
            "</b></div>";
          const s = 1 + x;
          let t;
          if (s >= 0)
            t =
              "<b>The step n → n + 1 at this x.</b> (1 + x)<sup>n+1</sup> = (1 + x)·(1 + x)<sup>n</sup> ≥ (1 + x)(1 + nx) = 1 + (n + 1)x + nx<sup>2</sup> ≥ 1 + (n + 1)x. The first “≥” needs 1 + x = " +
              fmt(s) +
              " ≥ 0, which is true here. The second only drops nx<sup>2</sup> = " +
              fmt(n * x * x, 3) +
              " ≥ 0.";
          else
            t =
              "<b>The step breaks here.</b> 1 + x = " +
              fmt(s) +
              " &lt; 0, and multiplying an inequality by a negative number flips “≥”. That is why the proof needs x ≥ −1. " +
              (x >= -2
                ? "The inequality itself still holds for every n: Theorem 2.17 proves it for x ≥ −2 with two base cases and steps n → n + 2."
                : ok
                  ? "For n = " +
                    n +
                    " it still holds at this x, but below x = −2 it can fail for other n (try n = 3 at x = −3.5)."
                  : "For n = " +
                    n +
                    " it fails at this x, so no proof can cover this region.");
          $("bnStep").innerHTML = t;
        }

        /* ================= Part 4: injective / surjective ================= */
        const INF = Infinity;
        const FN = {
          sq: {
            t: "x²",
            f: (x) => x * x,
            dom: { full: [-INF, INF, "ℝ"], restr: [0, INF, "[0, ∞)"] },
            rng: {
              full: [0, INF, "[0, ∞)", false],
              restr: [0, INF, "[0, ∞)", false],
            },
            inj: { full: false, restr: true },
            inv: { t: "√y", f: Math.sqrt },
            why: "x and −x give the same value",
            mono: "increasing",
            sol: (c) =>
              c < 0 ? [] : c === 0 ? [0] : [-Math.sqrt(c), Math.sqrt(c)],
          },
          cube: {
            t: "x³",
            f: (x) => x * x * x,
            dom: { full: [-INF, INF, "ℝ"], restr: [0, INF, "[0, ∞)"] },
            rng: {
              full: [-INF, INF, "ℝ", false],
              restr: [0, INF, "[0, ∞)", false],
            },
            inj: { full: true, restr: true },
            inv: { t: "∛y", f: Math.cbrt },
            mono: "increasing",
            sol: (c) => [Math.cbrt(c)],
          },
          sin: {
            t: "sin x",
            f: Math.sin,
            dom: {
              full: [-INF, INF, "ℝ"],
              restr: [-PI / 2, PI / 2, "[−π/2, π/2]"],
            },
            rng: {
              full: [-1, 1, "[−1, 1]", false],
              restr: [-1, 1, "[−1, 1]", false],
            },
            inj: { full: false, restr: true },
            inv: { t: "arcsin y", f: Math.asin },
            why: "sin repeats every 2π",
            mono: "increasing",
            sol: (c) => {
              if (Math.abs(c) > 1) return [];
              const a = Math.asin(c),
                out = [];
              for (let k = -4; k <= 4; k++)
                out.push(a + TAU * k, PI - a + TAU * k);
              return [...new Set(out.map((v) => +v.toFixed(9)))].sort(
                (p, q) => p - q,
              );
            },
          },
          exp: {
            t: "eˣ",
            f: Math.exp,
            dom: { full: [-INF, INF, "ℝ"], restr: [0, INF, "[0, ∞)"] },
            rng: {
              full: [0, INF, "(0, ∞)", true],
              restr: [1, INF, "[1, ∞)", false],
            },
            inj: { full: true, restr: true },
            inv: { t: "ln y", f: Math.log },
            mono: "increasing",
            sol: (c) => (c > 0 ? [Math.log(c)] : []),
          },
        };
        let mpF = "sq",
          mpD = "full",
          mpY = "R",
          mpV = null;
        const cvMp = $("cvMp"),
          mpC = $("mpC");
        const mpInv = toggle("mpInv", false, () => drawMp());
        segButtons("mpFn", "f", (f) => {
          mpF = f;
          drawMp();
        });
        segButtons("mpDom", "d", (d) => {
          mpD = d;
          drawMp();
        });
        segButtons("mpCod", "y", (y) => {
          mpY = y;
          drawMp();
        });
        mpC.addEventListener("input", drawMp);
        const inDom = (x, D) => x >= D[0] - 1e-9 && x <= D[1] + 1e-9;
        const inRng = (c, R) =>
          (R[3] ? c > R[0] : c >= R[0] - 1e-9) && c <= R[1] + 1e-9;
        function drawMp() {
          const F = FN[mpF],
            D = F.dom[mpD],
            RG = F.rng[mpD],
            Y = mpY === "R" ? [-INF, INF, "ℝ", false] : RG;
          $("mpDfull").textContent = "D = " + F.dom.full[2];
          $("mpDrestr").textContent = "D = " + F.dom.restr[2];
          $("mpYrange").textContent = "Y = range " + RG[2];
          const inj = F.inj[mpD],
            sur = mpY === "range" || (RG[0] === -INF && RG[1] === INF),
            bij = inj && sur;
          $("mpInv").disabled = !bij;
          if (!bij && mpInv.get()) mpInv.set(false);
          const c = +mpC.value;
          $("mpCv").textContent = fmt(c);
          const { ctx, w, h } = fit(cvMp, 0.72, 440),
            v = eqView(w, h, 0.2, 0.6, 4.4);
          mpV = v;
          gridAxes(ctx, v, { xl: "x", yl: "y", sx: 1, sy: 1 });
          const vbar = (x, lo, hi, col, lw, al) => {
            const a = Math.max(lo, v.y0),
              b = Math.min(hi, v.y1);
            if (b < a) return;
            ctx.save();
            ctx.globalAlpha = al;
            ctx.strokeStyle = col;
            ctx.lineWidth = lw;
            ctx.beginPath();
            ctx.moveTo(x, v.Y(a));
            ctx.lineTo(x, v.Y(b));
            ctx.stroke();
            ctx.restore();
          };
          vbar(8, Y[0], Y[1], C.neg, 6, 0.55);
          vbar(18, RG[0], RG[1], C.field, 6, 0.9);
          {
            const a = Math.max(D[0], v.x0),
              b = Math.min(D[1], v.x1);
            ctx.save();
            ctx.globalAlpha = 0.6;
            ctx.strokeStyle = C.pos;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(v.X(a), h - 4);
            ctx.lineTo(v.X(b), h - 4);
            ctx.stroke();
            ctx.restore();
          }
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, w, h);
          ctx.clip();
          const N = 700;
          const path = (inside) => {
            ctx.beginPath();
            let pen = false;
            for (let i = 0; i <= N; i++) {
              let x = v.x0 + ((v.x1 - v.x0) * i) / N;
              const ok = inDom(x, D) === inside,
                y = F.f(x);
              if (ok && isFinite(y) && Math.abs(y) < 1e3) {
                pen ? ctx.lineTo(v.X(x), v.Y(y)) : ctx.moveTo(v.X(x), v.Y(y));
                pen = true;
              } else pen = false;
            }
            ctx.stroke();
          };
          ctx.strokeStyle = C.muted;
          ctx.lineWidth = 1.4;
          ctx.setLineDash([5, 5]);
          path(false);
          ctx.setLineDash([]);
          ctx.strokeStyle = C.field;
          ctx.lineWidth = 2.8;
          path(true);
          [D[0], D[1]].forEach((x) => {
            if (isFinite(x) && x >= v.x0 && x <= v.x1)
              dot(ctx, v.X(x), v.Y(F.f(x)), 4.5, C.field);
          });
          if (mpInv.get() && bij) {
            seg(
              ctx,
              v.X(-10),
              v.Y(-10),
              v.X(10),
              v.Y(10),
              C.muted,
              1.2,
              [2, 4],
            );
            ctx.strokeStyle = C.neg;
            ctx.lineWidth = 2.2;
            ctx.setLineDash([7, 5]);
            ctx.beginPath();
            const t0 = Math.max(D[0], -6),
              t1 = Math.min(D[1], 6);
            for (let i = 0; i <= N; i++) {
              const t = t0 + ((t1 - t0) * i) / N,
                y = F.f(t);
              const X = v.X(y),
                Yp = v.Y(t);
              i ? ctx.lineTo(X, Yp) : ctx.moveTo(X, Yp);
            }
            ctx.stroke();
            ctx.setLineDash([]);
            txt(
              ctx,
              "f⁻¹(y) = " + F.inv.t,
              w - 10,
              h - 16,
              C.neg,
              mono(12, "600"),
              "right",
            );
            txt(
              ctx,
              "y = x",
              v.X(v.y1 - 0.4) - 4,
              v.Y(v.y1 - 0.4),
              C.muted,
              mono(11),
              "right",
            );
          }
          seg(ctx, 0, v.Y(c), w, v.Y(c), C.ink, 1.6, [6, 4]);
          dot(ctx, w - 16, v.Y(c), 7, C.ink);
          txt(
            ctx,
            "y = " + fmt(c),
            w - 28,
            v.Y(c) - 9,
            C.ink,
            mono(12, "600"),
            "right",
          );
          const sols = F.sol(c).filter((x) => inDom(x, D));
          sols.forEach((x) => {
            if (x >= v.x0 && x <= v.x1) {
              seg(ctx, v.X(x), v.Y(c), v.X(x), v.Y(0), C.force, 1.2, [3, 3]);
              dot(ctx, v.X(x), v.Y(c), 5.5, C.force);
            }
          });
          ctx.restore();
          txt(ctx, "Y", 6, 14, C.neg, mono(11, "600"));
          txt(ctx, "W", 16, 14, C.field, mono(11, "600"));
          const infinite = mpF === "sin" && mpD === "full" && Math.abs(c) <= 1;
          const vis = sols.filter((x) => x >= v.x0 && x <= v.x1);
          const solTxt = infinite
            ? "infinitely many; visible: " + vis.map((x) => fmt(x)).join(", ")
            : sols.length
              ? sols.map((x) => "x = " + fmt(x)).join(", ")
              : "none";
          $("roMp").innerHTML =
            '<div class="wide"><span>the function</span><b>f : ' +
            D[2] +
            " → " +
            Y[2] +
            ", f(x) = " +
            F.t +
            "</b></div>" +
            "<div><span>range W(f)</span><b>" +
            RG[2] +
            "</b></div>" +
            "<div><span>injective</span><b>" +
            (inj ? "yes: strictly " + F.mono + " on " + D[2] : "no: " + F.why) +
            "</b></div>" +
            "<div><span>surjective</span><b>" +
            (sur
              ? "yes: W(f) = Y"
              : "no: values outside " + RG[2] + " are never hit") +
            "</b></div>" +
            "<div><span>solutions of f(x) = " +
            fmt(c) +
            "</span><b>" +
            solTxt +
            "</b></div>";
          const inC = inRng(c, Y);
          let line;
          if (!inC)
            line =
              "y = " +
              fmt(c) +
              " is outside the codomain, so it plays no role.";
          else if (infinite || sols.length >= 2)
            line =
              "The line meets the graph " +
              (infinite ? "infinitely often" : sols.length + " times") +
              ": several inputs, one output. Not injective.";
          else if (!sols.length)
            line =
              "y = " +
              fmt(c) +
              " lies in the codomain but is never hit. That alone breaks surjectivity.";
          else
            line =
              "Exactly one input gives y = " +
              fmt(c) +
              ": x = " +
              fmt(sols[0]) +
              (bij ? " = f⁻¹(" + fmt(c) + ")." : ".");
          $("mpLine").textContent = line;
          $("mpV").textContent = bij
            ? "Bijective: the inverse f⁻¹(y) = " +
              F.inv.t +
              " exists on " +
              RG[2] +
              "."
            : "Not bijective. " +
              (!inj ? "Restrict the domain to make it injective. " : "") +
              (!sur
                ? "Shrink the codomain to the range to make it surjective."
                : "");
        }
        drag(
          cvMp,
          () => {
            if (!mpV) return [];
            const y = mpV.Y(+mpC.value);
            return [...Array(14)].map((_, i) => ({
              x: ((i + 0.5) * mpV.w) / 14,
              y,
            }));
          },
          (i, p) => {
            mpC.value = clamp(snap(mpV.iy(p.y), 0.05), +mpC.min, +mpC.max);
            drawMp();
          },
          { r: 16 },
        );

        /* ================= Part 5: complex arithmetic ================= */
        const cvCx = $("cvCx");
        let cxMode = "polar",
          cz = [-1, 1],
          cw = [2, -3],
          cxV = null;
        const cxSnap = toggle("cxSnap", true, () => {});
        segButtons("cxMode", "m", (m) => {
          cxMode = m;
          drawCx();
        });
        const cmul = (a, b) => [
          a[0] * b[0] - a[1] * b[1],
          a[0] * b[1] + a[1] * b[0],
        ];
        const cdiv = (a, b) => {
          const d = b[0] * b[0] + b[1] * b[1];
          return [
            (a[0] * b[0] + a[1] * b[1]) / d,
            (a[1] * b[0] - a[0] * b[1]) / d,
          ];
        };
        const cabs = (a) => Math.hypot(a[0], a[1]);
        function argQ(a, b) {
          const e = 1e-9;
          if (Math.abs(a) < e && Math.abs(b) < e)
            return { phi: NaN, rule: "z = 0: the angle is undefined" };
          if (Math.abs(a) < e)
            return b > 0
              ? { phi: PI / 2, rule: "a = 0, b > 0: φ = π/2" }
              : { phi: (3 * PI) / 2, rule: "a = 0, b < 0: φ = 3π/2" };
          const t = Math.atan(b / a);
          if (a > 0 && b > -e)
            return {
              phi: Math.max(t, 0),
              rule: "a > 0, b ≥ 0: φ = arctan(b/a)",
              naive: t,
            };
          if (a > 0)
            return {
              phi: t + TAU,
              rule: "a > 0, b < 0: φ = arctan(b/a) + 2π",
              naive: t,
            };
          return { phi: t + PI, rule: "a < 0: φ = arctan(b/a) + π", naive: t };
        }
        function angArc(ctx, O, R, a1, col, lab) {
          if (isNaN(a1) || a1 < 1e-6) return;
          ctx.save();
          ctx.strokeStyle = col;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(O.x, O.y, R, 0, -a1, true);
          ctx.stroke();
          ctx.restore();
          const m = a1 / 2;
          txt(
            ctx,
            lab,
            O.x + Math.cos(m) * (R + 11),
            O.y - Math.sin(m) * (R + 11) + 4,
            col,
            serif(14),
            "center",
          );
        }
        function drawCx() {
          const { ctx, w, h } = fit(cvCx, 0.7, 460),
            v = eqView(w, h, 0, 0, 4.6);
          cxV = v;
          gridAxes(ctx, v, { xl: "Re", yl: "Im", sx: 1, sy: 1 });
          const O = { x: v.X(0), y: v.Y(0) },
            P = (p) => ({ x: v.X(p[0]), y: v.Y(p[1]) });
          ctx.save();
          ctx.strokeStyle = C.muted;
          ctx.globalAlpha = 0.7;
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.arc(O.x, O.y, v.unit, 0, TAU);
          ctx.stroke();
          ctx.restore();
          const useW =
            cxMode === "sum" || cxMode === "prod" || cxMode === "quot";
          let res = null,
            resLab = "";
          if (cxMode === "conj") {
            res = [cz[0], -cz[1]];
            resLab = "z̄";
          }
          if (cxMode === "sum") {
            res = [cz[0] + cw[0], cz[1] + cw[1]];
            resLab = "z + w";
          }
          if (cxMode === "prod") {
            res = cmul(cz, cw);
            resLab = "z·w";
          }
          if (cxMode === "quot" && cabs(cw) > 1e-9) {
            res = cdiv(cz, cw);
            resLab = "z / w";
          }
          const az = argQ(cz[0], cz[1]),
            aw = argQ(cw[0], cw[1]),
            ar = res ? argQ(res[0], res[1]) : null;
          if (cxMode === "polar" || cxMode === "conj") {
            const pz = P(cz);
            seg(ctx, pz.x, pz.y, pz.x, O.y, C.muted, 1.2, [4, 4]);
            seg(ctx, pz.x, pz.y, O.x, pz.y, C.muted, 1.2, [4, 4]);
            txt(
              ctx,
              "a = " + fmt(cz[0]),
              pz.x,
              O.y + (cz[1] >= 0 ? 28 : -18),
              C.ink,
              mono(11),
              "center",
            );
            txt(
              ctx,
              "b = " + fmt(cz[1]),
              O.x + (cz[0] >= 0 ? -6 : 6),
              pz.y + 4,
              C.ink,
              mono(11),
              cz[0] >= 0 ? "right" : "left",
            );
            angArc(ctx, O, Math.max(24, v.unit * 0.7), az.phi, C.pos, "φ");
            if (cxMode === "conj") {
              const pr = P(res);
              seg(ctx, pz.x, pz.y, pr.x, pr.y, C.muted, 1.2, [2, 4]);
              angArc(ctx, O, Math.max(36, v.unit * 1.0), ar.phi, C.force, "−φ");
            }
          }
          if (cxMode === "sum" && res) {
            const pz = P(cz),
              pw = P(cw),
              pr = P(res);
            seg(ctx, pz.x, pz.y, pr.x, pr.y, C.neg, 1.4, [5, 4]);
            seg(ctx, pw.x, pw.y, pr.x, pr.y, C.pos, 1.4, [5, 4]);
          }
          if ((cxMode === "prod" || cxMode === "quot") && res) {
            angArc(ctx, O, Math.max(22, v.unit * 0.5), az.phi, C.pos, "φ");
            angArc(ctx, O, Math.max(36, v.unit * 0.85), aw.phi, C.neg, "ψ");
            angArc(
              ctx,
              O,
              Math.max(50, v.unit * 1.2),
              ar.phi,
              C.force,
              cxMode === "prod" ? "φ+ψ" : "φ−ψ",
            );
            ctx.save();
            ctx.strokeStyle = C.force;
            ctx.globalAlpha = 0.45;
            ctx.setLineDash([2, 5]);
            ctx.beginPath();
            ctx.arc(O.x, O.y, cabs(res) * v.unit, 0, TAU);
            ctx.stroke();
            ctx.restore();
          }
          const label = (p, s, col) => {
            const q = P(p),
              n = Math.hypot(p[0], p[1]) || 1;
            txt(
              ctx,
              s,
              q.x + (p[0] / n) * 14,
              q.y - (p[1] / n) * 14 + 5,
              col,
              serif(15),
              "center",
            );
          };
          if (res) {
            const pr = P(res);
            arrow(ctx, O.x, O.y, pr.x, pr.y, C.force, 3.4, 11);
            label(res, resLab, C.force);
          }
          if (useW) {
            const pw = P(cw);
            arrow(ctx, O.x, O.y, pw.x, pw.y, C.neg, 2.4);
            dot(ctx, pw.x, pw.y, 6, C.neg);
            label(cw, "w", C.neg);
          }
          {
            const pz = P(cz);
            arrow(ctx, O.x, O.y, pz.x, pz.y, C.pos, 2.4);
            dot(ctx, pz.x, pz.y, 6, C.pos);
            label(cz, "z", C.pos);
          }
          const row = (name, p) => {
            const a = argQ(p[0], p[1]),
              r = cabs(p);
            return (
              "<tr><td>" +
              name +
              "</td><td>" +
              cStr(p[0], p[1], 3) +
              "</td><td>" +
              rStr(r) +
              "</td><td>" +
              angStr(a.phi) +
              "</td><td>" +
              (isNaN(a.phi)
                ? "0"
                : fmt(r, 3) + "·e<sup>i·" + piStr(a.phi) + "</sup>") +
              "</td></tr>"
            );
          };
          let tb =
            "<tr><th>number</th><th>normal form</th><th>|·|</th><th>arg ∈ [0, 2π)</th><th>exponential form</th></tr>" +
            row("z", cz);
          if (useW) tb += row("w", cw);
          if (res) tb += row(resLab, res);
          $("tbCx").innerHTML = tb;
          const rz = cabs(cz),
            rw = cabs(cw);
          let t = "";
          if (cxMode === "polar") t = "<b>Quadrant rule.</b> " + az.rule + ".";
          if (cxMode === "conj")
            t =
              "<b>Conjugate.</b> z̄ = a − ib is z reflected across the real axis: same modulus, angle −φ (here " +
              angStr(isNaN(az.phi) ? NaN : (TAU - az.phi) % TAU) +
              "). And z·z̄ = |z|<sup>2</sup> = " +
              fmt(rz * rz) +
              ", always real.";
          if (cxMode === "sum")
            t =
              "<b>Add coordinate by coordinate.</b> (" +
              fmt(cz[0]) +
              " + " +
              fmt(cw[0]) +
              ") + i(" +
              fmt(cz[1]) +
              " + " +
              fmt(cw[1]) +
              ") = " +
              cStr(res[0], res[1]) +
              ". Geometrically: tip to tail, the diagonal of the parallelogram.";
          if (cxMode === "prod" && res) {
            const s = az.phi + aw.phi;
            t =
              "<b>Moduli multiply, angles add.</b> |z|·|w| = " +
              fmt(rz, 3) +
              " · " +
              fmt(rw, 3) +
              " = " +
              fmt(rz * rw, 3) +
              ". φ + ψ = " +
              piStr(az.phi) +
              " + " +
              piStr(aw.phi) +
              " = " +
              piStr(s) +
              (s >= TAU - 1e-9 ? " − 2π = " + piStr(s - TAU) : "") +
              ". In normal form: (" +
              cStr(cz[0], cz[1]) +
              ")(" +
              cStr(cw[0], cw[1]) +
              ") = " +
              cStr(res[0], res[1], 3) +
              ".";
          }
          if (cxMode === "quot") {
            if (!res) t = "<b>w = 0:</b> division is undefined.";
            else {
              const d = az.phi - aw.phi,
                num = cmul(cz, [cw[0], -cw[1]]);
              t =
                "<b>Moduli divide, angles subtract.</b> |z|/|w| = " +
                fmt(rz / rw, 3) +
                ". φ − ψ = " +
                piStr(az.phi) +
                " − " +
                piStr(aw.phi) +
                " = " +
                piStr(d) +
                (d < -1e-9 ? " + 2π = " + piStr(d + TAU) : "") +
                ". In normal form, multiply by the conjugate: z·w̄ / |w|<sup>2</sup> = (" +
                cStr(num[0], num[1]) +
                ") / " +
                fmt(rw * rw) +
                " = " +
                cStr(res[0], res[1], 3) +
                ".";
            }
          }
          if (
            az.naive !== undefined &&
            Math.abs(az.naive - az.phi) > 1e-9 &&
            (cxMode === "polar" || cxMode === "conj")
          ) {
            t +=
              cz[0] < 0
                ? " <b>Careful:</b> arctan(b/a) alone gives " +
                  piStr(az.naive) +
                  ", which points into the opposite quadrant."
                : " arctan(b/a) gives " +
                  piStr(az.naive) +
                  ", the right direction but negative; adding 2π puts it in [0, 2π).";
          }
          $("cxRule").innerHTML = t;
        }
        drag(
          cvCx,
          () => {
            if (!cxV) return [];
            const pts = [{ x: cxV.X(cz[0]), y: cxV.Y(cz[1]) }];
            if (cxMode === "sum" || cxMode === "prod" || cxMode === "quot")
              pts.push({ x: cxV.X(cw[0]), y: cxV.Y(cw[1]) });
            return pts;
          },
          (i, p) => {
            let x = cxV.ix(p.x),
              y = cxV.iy(p.y);
            if (cxSnap.get()) {
              x = snap(x, 0.5);
              y = snap(y, 0.5);
            }
            x = clamp(x, cxV.x0 + 0.2, cxV.x1 - 0.2);
            y = clamp(y, cxV.y0 + 0.2, cxV.y1 - 0.2);
            if (i === 0) cz = [x, y];
            else cw = [x, y];
            drawCx();
          },
        );

        /* ================= Part 6: powers and roots ================= */
        const cvPr = $("cvPr"),
          prK = $("prK"),
          prN = $("prN");
        let prMode = "pow",
          pz = [1, 1],
          pwr = [0, 8],
          prR = null,
          prDrag = false,
          prV = null;
        segButtons("prMode", "m", (m) => {
          prMode = m;
          prR = null;
          drawPr();
        });
        prK.addEventListener("input", () => {
          prR = null;
          drawPr();
        });
        prN.addEventListener("input", () => {
          prR = null;
          drawPr();
        });
        function prPoints() {
          if (prMode === "pow") {
            const K = +prK.value,
              r = cabs(pz),
              a = Math.atan2(pz[1], pz[0]);
            return [...Array(K + 1)].map((_, k) => [
              Math.pow(r, k) * Math.cos(k * a),
              Math.pow(r, k) * Math.sin(k * a),
            ]);
          }
          const n = +prN.value,
            r = cabs(pwr),
            A = argQ(pwr[0], pwr[1]).phi || 0,
            rr = Math.pow(r, 1 / n);
          return [...Array(n)].map((_, k) => {
            const t = (A + TAU * k) / n;
            return [rr * Math.cos(t), rr * Math.sin(t)];
          });
        }
        function drawPr() {
          prK.disabled = prMode !== "pow";
          prN.disabled = prMode !== "root";
          $("prKv").textContent = prK.value;
          $("prNv").textContent = prN.value;
          const pts = prPoints(),
            hd = prMode === "pow" ? pz : pwr;
          const { ctx, w, h } = fit(cvPr, 0.72, 460);
          if (!prDrag || prR === null) {
            const all = pts.concat([
              hd,
              [0, 0],
              [1, 0],
              [-1, 0],
              [0, 1],
              [0, -1],
            ]);
            const xs = all.map((p) => p[0]),
              ys = all.map((p) => p[1]);
            const x0 = Math.min(...xs),
              x1 = Math.max(...xs),
              y0 = Math.min(...ys),
              y1 = Math.max(...ys);
            const dx = (x1 - x0) * 1.25 + 0.4,
              dy = (y1 - y0) * 1.25 + 0.4;
            prR = {
              cx: (x0 + x1) / 2,
              cy: (y0 + y1) / 2,
              unit: Math.min(w / dx, h / dy),
            };
          }
          const v = plane(w, h, prR.cx, prR.cy, prR.unit);
          prV = v;
          gridAxes(ctx, v, { xl: "Re", yl: "Im" });
          const O = { x: v.X(0), y: v.Y(0) },
            P = (p) => ({ x: v.X(p[0]), y: v.Y(p[1]) });
          ctx.save();
          ctx.strokeStyle = C.muted;
          ctx.globalAlpha = 0.6;
          ctx.setLineDash([3, 4]);
          ctx.beginPath();
          ctx.arc(O.x, O.y, v.unit, 0, TAU);
          ctx.stroke();
          ctx.restore();
          if (prMode === "pow") {
            ctx.strokeStyle = C.field;
            ctx.lineWidth = 2;
            ctx.setLineDash([]);
            ctx.beginPath();
            pts.forEach((p, k) => {
              const q = P(p);
              k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
            });
            ctx.stroke();
            pts.forEach((p, k) => {
              const q = P(p);
              seg(ctx, O.x, O.y, q.x, q.y, C.line, 1);
              dot(
                ctx,
                q.x,
                q.y,
                k === 1 ? 6.5 : 4.5,
                k === 1 ? C.pos : C.force,
              );
              const n = cabs(p) || 1;
              txt(
                ctx,
                "z" + supU(k),
                q.x + (p[0] / n) * 14,
                q.y - (p[1] / n) * 14 + 4,
                k === 1 ? C.pos : C.ink,
                serif(13),
                "center",
              );
            });
            const r = cabs(pz),
              a = argQ(pz[0], pz[1]).phi;
            $("prRule").innerHTML =
              "<b>de Moivre.</b> z = " +
              cStr(pz[0], pz[1]) +
              " has r = " +
              rStr(r) +
              " and φ = " +
              angStr(a) +
              ". Each power multiplies the length by " +
              fmt(r, 3) +
              " and turns by φ. " +
              (r > 1 + 1e-9
                ? "r > 1, so the points spiral outward."
                : r < 1 - 1e-9
                  ? "r < 1, so they spiral in towards 0."
                  : "r = 1, so they stay on the unit circle.");
            let tb =
              "<tr><th>k</th><th>z<sup>k</sup></th><th>r<sup>k</sup></th><th>kφ reduced to [0, 2π)</th></tr>";
            pts.forEach((p, k) => {
              tb +=
                "<tr><td>" +
                k +
                "</td><td>" +
                cStr(p[0], p[1], 3) +
                "</td><td>" +
                fmt(Math.pow(r, k), 3) +
                "</td><td>" +
                (isNaN(a) ? "—" : piStr((((k * a) % TAU) + TAU) % TAU)) +
                "</td></tr>";
            });
            $("tbPr").innerHTML = tb;
          } else {
            const n = +prN.value,
              r = cabs(pwr),
              A = argQ(pwr[0], pwr[1]).phi,
              rr = Math.pow(r, 1 / n);
            ctx.save();
            ctx.strokeStyle = C.muted;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.arc(O.x, O.y, rr * v.unit, 0, TAU);
            ctx.stroke();
            ctx.restore();
            ctx.save();
            ctx.globalAlpha = 0.55;
            ctx.fillStyle = C.hl;
            ctx.strokeStyle = C.field;
            ctx.lineWidth = 2;
            ctx.beginPath();
            pts.forEach((p, k) => {
              const q = P(p);
              k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
            });
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.stroke();
            ctx.restore();
            if (!isNaN(A))
              angArc(
                ctx,
                O,
                Math.max(26, rr * v.unit * 0.45),
                A / n,
                C.force,
                "φ/n",
              );
            pts.forEach((p, k) => {
              const q = P(p);
              seg(ctx, O.x, O.y, q.x, q.y, C.line, 1);
              dot(ctx, q.x, q.y, 5.5, C.force);
              const m = cabs(p) || 1;
              txt(
                ctx,
                "w" + "₀₁₂₃₄₅₆₇"[k],
                q.x + (p[0] / m) * 15,
                q.y - (p[1] / m) * 15 + 4,
                C.force,
                serif(13),
                "center",
              );
            });
            const q = P(pwr);
            arrow(ctx, O.x, O.y, q.x, q.y, C.neg, 2.2);
            dot(ctx, q.x, q.y, 6.5, C.neg);
            const m = cabs(pwr) || 1;
            txt(
              ctx,
              "w",
              q.x + (pwr[0] / m) * 14,
              q.y - (pwr[1] / m) * 14 + 5,
              C.neg,
              serif(15),
              "center",
            );
            $("prRule").innerHTML = isNaN(A)
              ? "<b>w = 0</b> has only the root 0."
              : "<b>The " +
                n +
                " roots of w = " +
                cStr(pwr[0], pwr[1]) +
                ".</b> w = " +
                rStr(r) +
                "·e<sup>i·" +
                piStr(A) +
                "</sup>. Every root has length <sup>" +
                n +
                "</sup>√" +
                fmt(r, 3) +
                " = " +
                fmt(rr, 3) +
                ". The first sits at angle φ/n = " +
                piStr(A / n) +
                ", the others follow in steps of 2π/n = " +
                piStr(TAU / n) +
                ": a regular " +
                n +
                "-gon.";
            let tb =
              "<tr><th>k</th><th>w<sub>k</sub></th><th>angle (φ + 2kπ)/n</th><th>check: w<sub>k</sub><sup>n</sup></th></tr>";
            pts.forEach((p, k) => {
              const t = (A + TAU * k) / n;
              let pw = [1, 0];
              for (let j = 0; j < n; j++) pw = cmul(pw, p);
              tb +=
                "<tr><td>" +
                k +
                "</td><td>" +
                cStr(p[0], p[1], 3) +
                "</td><td>" +
                piStr(t) +
                "</td><td>" +
                cStr(pw[0], pw[1]) +
                "</td></tr>";
            });
            $("tbPr").innerHTML = tb;
          }
        }
        drag(
          cvPr,
          () => {
            if (!prV) return [];
            const p = prMode === "pow" ? pz : pwr;
            return [{ x: prV.X(p[0]), y: prV.Y(p[1]) }];
          },
          (i, p) => {
            const x = clamp(snap(prV.ix(p.x), 0.25), prV.x0, prV.x1),
              y = clamp(snap(prV.iy(p.y), 0.25), prV.y0, prV.y1);
            if (prMode === "pow") pz = [x, y];
            else pwr = [x, y];
            drawPr();
          },
          {
            start: () => {
              prDrag = true;
            },
            end: () => {
              prDrag = false;
              drawPr();
            },
          },
        );

        /* ================= Part 7: vectors ================= */
        const cvVc = $("cvVc");
        let va = [3, 1],
          vb = [1, 2],
          vcV = null;
        const vcNorm = toggle("vcNorm", false, () => drawVc());
        function drawVc() {
          const { ctx, w, h } = fit(cvVc, 0.66, 440),
            v = eqView(w, h, 0.5, 0.5, 4.6);
          vcV = v;
          gridAxes(ctx, v, { sx: 1, sy: 1 });
          const O = { x: v.X(0), y: v.Y(0) },
            P = (p) => ({ x: v.X(p[0]), y: v.Y(p[1]) });
          const dt = va[0] * vb[0] + va[1] * vb[1],
            na = Math.hypot(va[0], va[1]),
            nb = Math.hypot(vb[0], vb[1]),
            cr = va[0] * vb[1] - va[1] * vb[0];
          ctx.save();
          ctx.globalAlpha = 0.8;
          ctx.fillStyle = C.hl;
          ctx.beginPath();
          [[0, 0], va, [va[0] + vb[0], va[1] + vb[1]], vb].forEach((q, i) => {
            const s = P(q);
            i ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y);
          });
          ctx.closePath();
          ctx.fill();
          ctx.restore();
          const n1 = Math.abs(va[0]) + Math.abs(va[1]),
            ni = Math.max(Math.abs(va[0]), Math.abs(va[1]));
          if (vcNorm.get()) {
            ctx.save();
            ctx.lineWidth = 1.6;
            ctx.strokeStyle = C.field;
            ctx.beginPath();
            [
              [n1, 0],
              [0, n1],
              [-n1, 0],
              [0, -n1],
            ].forEach((q, i) => {
              const s = P(q);
              i ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y);
            });
            ctx.closePath();
            ctx.stroke();
            ctx.strokeStyle = C.ink;
            ctx.beginPath();
            ctx.arc(O.x, O.y, na * v.unit, 0, TAU);
            ctx.stroke();
            ctx.strokeStyle = C.muted;
            ctx.setLineDash([5, 4]);
            ctx.strokeRect(v.X(-ni), v.Y(ni), 2 * ni * v.unit, 2 * ni * v.unit);
            ctx.restore();
            txt(
              ctx,
              "‖a‖₁ = " + fmt(n1),
              v.X(n1) + 4,
              O.y - 6,
              C.field,
              mono(11, "600"),
            );
            txt(
              ctx,
              "‖a‖∞ = " + fmt(ni),
              v.X(ni) + 4,
              v.Y(ni) - 6,
              C.muted,
              mono(11, "600"),
            );
          }
          let foot = null;
          if (nb > 1e-9) {
            const t = dt / (nb * nb);
            foot = [t * vb[0], t * vb[1]];
            const ub = [vb[0] / nb, vb[1] / nb];
            seg(
              ctx,
              v.X(-12 * ub[0]),
              v.Y(-12 * ub[1]),
              v.X(12 * ub[0]),
              v.Y(12 * ub[1]),
              C.line,
              1.2,
              [2, 4],
            );
            const F = P(foot),
              A = P(va);
            seg(ctx, A.x, A.y, F.x, F.y, C.muted, 1.4, [5, 4]);
            if (
              Math.hypot(A.x - F.x, A.y - F.y) > 10 &&
              Math.hypot(F.x - O.x, F.y - O.y) > 10
            ) {
              const nx = A.x - F.x,
                ny = A.y - F.y,
                nl = Math.hypot(nx, ny),
                ux = O.x - F.x,
                uy = O.y - F.y,
                ul = Math.hypot(ux, uy),
                s = 9;
              const p1 = [F.x + (nx / nl) * s, F.y + (ny / nl) * s],
                p2 = [p1[0] + (ux / ul) * s, p1[1] + (uy / ul) * s],
                p3 = [F.x + (ux / ul) * s, F.y + (uy / ul) * s];
              ctx.strokeStyle = C.muted;
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.moveTo(p1[0], p1[1]);
              ctx.lineTo(p2[0], p2[1]);
              ctx.lineTo(p3[0], p3[1]);
              ctx.stroke();
            }
            arrow(ctx, O.x, O.y, F.x, F.y, C.force, 4, 11);
          }
          if (na > 1e-9 && nb > 1e-9) {
            const ta = Math.atan2(va[1], va[0]),
              tb = Math.atan2(vb[1], vb[0]);
            let d = tb - ta;
            while (d > PI) d -= TAU;
            while (d <= -PI) d += TAU;
            const R = Math.max(22, v.unit * 0.55);
            ctx.save();
            ctx.strokeStyle = C.ink;
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.arc(O.x, O.y, R, -ta, -(ta + d), d > 0);
            ctx.stroke();
            ctx.restore();
            const m = ta + d / 2;
            txt(
              ctx,
              "φ",
              O.x + Math.cos(m) * (R + 10),
              O.y - Math.sin(m) * (R + 10) + 5,
              C.ink,
              serif(14),
              "center",
            );
          }
          const lab = (p, s, col) => {
            const q = P(p),
              n = Math.hypot(p[0], p[1]) || 1;
            txt(
              ctx,
              s,
              q.x + (p[0] / n) * 15,
              q.y - (p[1] / n) * 15 + 5,
              col,
              serif(16),
              "center",
            );
          };
          {
            const q = P(vb);
            arrow(ctx, O.x, O.y, q.x, q.y, C.neg, 2.6);
            dot(ctx, q.x, q.y, 6, C.neg);
            lab(vb, "b", C.neg);
          }
          {
            const q = P(va);
            arrow(ctx, O.x, O.y, q.x, q.y, C.pos, 2.6);
            dot(ctx, q.x, q.y, 6, C.pos);
            lab(va, "a", C.pos);
          }
          const cosp =
              na > 1e-9 && nb > 1e-9 ? clamp(dt / (na * nb), -1, 1) : NaN,
            phi = Math.acos(cosp);
          let html =
            "<div><span>⟨a, b⟩ = a₁b₁ + a₂b₂</span><b>" +
            fmt(va[0]) +
            "·" +
            fmt(vb[0]) +
            " + " +
            fmt(va[1]) +
            "·" +
            fmt(vb[1]) +
            " = " +
            fmt(dt) +
            "</b></div>" +
            "<div><span>|a|, |b|</span><b>" +
            rStr(na) +
            ", " +
            rStr(nb) +
            "</b></div>" +
            "<div><span>cos φ = ⟨a, b⟩ / (|a| |b|)</span><b>" +
            fmt(cosp, 3) +
            "</b></div>" +
            "<div><span>angle φ</span><b>" +
            (isNaN(phi) ? "undefined" : angStr(phi)) +
            "</b></div>" +
            "<div><span>projection of a onto b</span><b>" +
            (foot
              ? fmt(dt / (nb * nb), 3) +
                "·b = (" +
                fmt(foot[0]) +
                ", " +
                fmt(foot[1]) +
                ")"
              : "—") +
            "</b></div>" +
            "<div><span>area |a₁b₂ − a₂b₁| = |a × b|</span><b>" +
            fmt(Math.abs(cr), 3) +
            "</b></div>" +
            "<div><span>check: |a| |b| sin φ</span><b>" +
            (isNaN(phi) ? "—" : fmt(na * nb * Math.sin(phi), 3)) +
            "</b></div>";
          if (vcNorm.get())
            html +=
              "<div><span>‖a‖₁ ≥ ‖a‖₂ ≥ ‖a‖∞</span><b>" +
              fmt(n1, 3) +
              " ≥ " +
              fmt(na, 3) +
              " ≥ " +
              fmt(ni, 3) +
              "</b></div>";
          $("roVc").innerHTML = html;
          $("vcV").textContent =
            na < 1e-9 || nb < 1e-9
              ? "A zero vector has no direction, so the angle is undefined."
              : Math.abs(dt) < 1e-9
                ? "Orthogonal: ⟨a, b⟩ = 0, φ = 90°, and the projection is the zero vector."
                : Math.abs(cr) < 1e-9
                  ? "Parallel: the area is 0, so a × b = 0 and a, b are linearly dependent."
                  : dt > 0
                    ? "Acute angle: ⟨a, b⟩ > 0, so the projection points along b."
                    : "Obtuse angle: ⟨a, b⟩ < 0, so the projection points against b.";
        }
        drag(
          cvVc,
          () =>
            vcV
              ? [
                  { x: vcV.X(va[0]), y: vcV.Y(va[1]) },
                  { x: vcV.X(vb[0]), y: vcV.Y(vb[1]) },
                ]
              : [],
          (i, p) => {
            const x = clamp(snap(vcV.ix(p.x), 0.5), vcV.x0 + 0.3, vcV.x1 - 0.3),
              y = clamp(snap(vcV.iy(p.y), 0.5), vcV.y0 + 0.3, vcV.y1 - 0.3);
            if (i === 0) va = [x, y];
            else vb = [x, y];
            drawVc();
          },
        );

        /* ================= Part 8a: two lines ================= */
        const lnA = $("lnA"),
          lnB = $("lnB"),
          cvLn = $("cvLn");
        [lnA, lnB].forEach((x) => x.addEventListener("input", drawLn));
        function lineEq(a, b, c) {
          let s = a === 1 ? "x" : a === -1 ? "−x" : a === 0 ? "" : fmt(a) + "x";
          if (b !== 0) {
            const m = Math.abs(b) === 1 ? "" : fmt(Math.abs(b));
            s += s
              ? (b > 0 ? " + " : " − ") + m + "y"
              : (b < 0 ? "−" : "") + m + "y";
          }
          return (s || "0") + " = " + fmt(c);
        }
        function drawLn() {
          const al = +lnA.value,
            be = +lnB.value;
          $("lnAv").textContent = fmt(al);
          $("lnBv").textContent = fmt(be);
          const { ctx, w, h } = fit(cvLn, 0.58, 400),
            v = eqView(w, h, 1, 0.5, w < 480 ? 4.5 : 6.5);
          gridAxes(ctx, v, { xl: "x", yl: "y", sx: 1, sy: 1 });
          const drawLine = (a, b, c, col, dash, lab, lx) => {
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, w, h);
            ctx.clip();
            let p1, p2, L;
            if (Math.abs(b) > 1e-9) {
              p1 = [v.x0 - 1, (c - a * (v.x0 - 1)) / b];
              p2 = [v.x1 + 1, (c - a * (v.x1 + 1)) / b];
              L = [lx, (c - a * lx) / b];
            } else {
              const x = c / a;
              p1 = [x, v.y0 - 1];
              p2 = [x, v.y1 + 1];
              L = [x, v.y1 - 1];
            }
            seg(
              ctx,
              v.X(p1[0]),
              v.Y(p1[1]),
              v.X(p2[0]),
              v.Y(p2[1]),
              col,
              2.6,
              dash,
            );
            ctx.restore();
            const ly = clamp(v.Y(L[1]), 18, h - 10);
            txt(
              ctx,
              lab,
              clamp(v.X(L[0]) + 8, 4, w - 150),
              ly - 8,
              col,
              mono(12, "600"),
            );
          };
          const span = v.x1 - v.x0;
          drawLine(1, al, 2, C.pos, null, lineEq(1, al, 2), v.x0 + span * 0.04);
          drawLine(
            2,
            4,
            be,
            C.neg,
            [9, 6],
            lineEq(2, 4, be),
            v.x0 + span * 0.7,
          );
          const p = 4 - 2 * al,
            q = be - 4;
          let sol = null;
          if (Math.abs(p) > 1e-9) {
            const y = q / p,
              x = 2 - al * y;
            sol = [x, y];
            if (x > v.x0 && x < v.x1 && y > v.y0 && y < v.y1) {
              dot(ctx, v.X(x), v.Y(y), 6.5, C.force, C.surface);
              if (w >= 480)
                txt(
                  ctx,
                  "(" + fmt(x) + ", " + fmt(y) + ")",
                  v.X(x) + 10,
                  v.Y(y) + 18,
                  C.force,
                  mono(12, "600"),
                );
            }
          }
          const rA = Math.abs(p) > 1e-9 ? 2 : 1,
            rAb = Math.abs(p) > 1e-9 || Math.abs(q) > 1e-9 ? 2 : 1;
          $("lnMat").innerHTML =
            '<p class="note" style="text-align:center">After R2 → R2 − 2·R1</p>' +
            matHTML(
              [
                [1, al, 2],
                [0, p, q],
              ],
              2,
              {
                heads: ["x", "y", "b"],
                piv:
                  Math.abs(p) > 1e-9
                    ? [
                        [0, 0],
                        [1, 1],
                      ]
                    : [[0, 0]],
                bad: rA < rAb ? 1 : undefined,
              },
            );
          $("roLn").innerHTML =
            "<div><span>rk(A)</span><b>" +
            rA +
            "</b></div><div><span>rk(A | b)</span><b>" +
            rAb +
            "</b></div><div><span>unknowns n</span><b>2</b></div>" +
            "<div><span>solution</span><b>" +
            (sol
              ? "x = " + fmt(sol[0], 3) + ", y = " + fmt(sol[1], 3)
              : rA < rAb
                ? "none"
                : "y = λ, x = 2 − 2λ") +
            "</b></div>";
          $("lnV").textContent =
            rA === 2
              ? "rk(A) = rk(A | b) = 2 = n: exactly one solution. The lines cross once."
              : rA < rAb
                ? "rk(A) = 1 but rk(A | b) = 2: no solution. The last row reads 0 = " +
                  fmt(q) +
                  ", and the lines are parallel."
                : "rk(A) = rk(A | b) = 1 < n = 2: infinitely many solutions with one free parameter. The two lines are the same line.";
        }

        /* ================= Part 8b: Gauss stepper ================= */
        class Fr {
          constructor(n, d) {
            d = d === undefined ? 1 : d;
            if (d < 0) {
              n = -n;
              d = -d;
            }
            const g = gcd(n, d);
            this.n = n / g;
            this.d = d / g;
          }
          add(o) {
            return new Fr(this.n * o.d + o.n * this.d, this.d * o.d);
          }
          sub(o) {
            return new Fr(this.n * o.d - o.n * this.d, this.d * o.d);
          }
          mul(o) {
            return new Fr(this.n * o.n, this.d * o.d);
          }
          div(o) {
            return new Fr(this.n * o.d, this.d * o.n);
          }
          z() {
            return this.n === 0;
          }
          one() {
            return this.n === this.d;
          }
          neg() {
            return new Fr(-this.n, this.d);
          }
          s() {
            const t =
              this.d === 1
                ? String(Math.abs(this.n))
                : Math.abs(this.n) + "/" + this.d;
            return (this.n < 0 ? "−" : "") + t;
          }
        }
        const GP = {
          unique: {
            n: 3,
            M: [
              [1, 1, 1, 6],
              [2, -1, 1, 3],
              [1, 2, -1, 2],
            ],
          },
          infinite: {
            n: 3,
            M: [
              [1, 2, -1, 3],
              [2, 4, 1, 9],
              [3, 6, 0, 12],
            ],
          },
          none: {
            n: 3,
            M: [
              [1, 1, 1, 2],
              [1, 2, 3, 5],
              [2, 3, 4, 8],
            ],
          },
          notes: {
            n: 4,
            M: [
              [0, 0, 2, -2, -2],
              [3, 3, -3, 9, 12],
              [4, 4, -2, 11, 12],
            ],
          },
        };
        const coefTxt = (q) =>
          q.one() ? "" : q.d === 1 ? q.s() + "·" : "(" + q.s() + ")·";
        const opTxt = (i, r, q) =>
          "R" +
          (i + 1) +
          " → R" +
          (i + 1) +
          (q.n > 0 ? " − " + coefTxt(q) : " + " + coefTxt(q.neg())) +
          "R" +
          (r + 1);
        const xv = (j) => "x" + sub(j + 1);
        function linFr(c0, terms) {
          let s = "";
          terms.forEach(([c, p]) => {
            if (c.z()) return;
            const mag = c.n < 0 ? c.neg() : c,
              m = mag.one() ? "" : mag.s();
            s +=
              s || !c0.z()
                ? (c.n < 0 ? " − " : " + ") + m + p
                : (c.n < 0 ? "−" : "") + m + p;
          });
          return c0.z() ? s || "0" : c0.s() + s;
        }
        function gaussSteps(M0, n) {
          const m = M0.length;
          let M = M0.map((r) => r.map((v) => new Fr(v)));
          const copy = () => M.map((r) => r.slice());
          const steps = [
            {
              M: copy(),
              txt: "Start: the augmented matrix (A | b). Goal: zeros below each pivot, working left to right.",
              rows: [],
              piv: [],
            },
          ];
          const pivots = [];
          let r = 0;
          for (let j = 0; j < n && r < m; j++) {
            let p = -1;
            for (let i = r; i < m; i++)
              if (!M[i][j].z()) {
                p = i;
                break;
              }
            if (p < 0) continue;
            if (p !== r) {
              [M[p], M[r]] = [M[r], M[p]];
              steps.push({
                M: copy(),
                txt:
                  "Column " +
                  (j + 1) +
                  ": the entry in row " +
                  (r + 1) +
                  " is 0 and cannot be a pivot, so swap R" +
                  (r + 1) +
                  " ↔ R" +
                  (p + 1) +
                  ".",
                rows: [r, p],
                piv: pivots.concat([[r, j]]),
              });
            }
            const ops = [],
              rows = [];
            for (let i = r + 1; i < m; i++) {
              if (M[i][j].z()) continue;
              const q = M[i][j].div(M[r][j]);
              M[i] = M[i].map((v, k) => v.sub(q.mul(M[r][k])));
              ops.push(opTxt(i, r, q));
              rows.push(i);
            }
            pivots.push([r, j]);
            if (ops.length)
              steps.push({
                M: copy(),
                txt:
                  "Pivot " +
                  M[r][j].s() +
                  " in column " +
                  (j + 1) +
                  ": clear everything below it. " +
                  ops.join(", ") +
                  ".",
                rows,
                piv: pivots.slice(),
              });
            r++;
          }
          const rank = r;
          let bad = -1;
          for (let i = rank; i < m; i++)
            if (!M[i][n].z()) {
              bad = i;
              break;
            }
          const rankAb = bad >= 0 ? rank + 1 : rank;
          const free = [...Array(n).keys()].filter(
            (j) => !pivots.some((p) => p[1] === j),
          );
          let verdict =
            "Row echelon form reached. rk(A) = " +
            rank +
            ", rk(A | b) = " +
            rankAb +
            ", n = " +
            n +
            ". ";
          if (bad >= 0)
            verdict +=
              "Row " +
              (bad + 1) +
              " reads 0 = " +
              M[bad][n].s() +
              ", a contradiction: no solution.";
          else if (rank === n)
            verdict +=
              "rk(A) = n: exactly one solution. Now back substitution: make each pivot 1 and clear the entries above it.";
          else
            verdict +=
              "rk(A) < n: infinitely many solutions with " +
              (n - rank) +
              " free parameter" +
              (n - rank > 1 ? "s" : "") +
              " (" +
              free.map(xv).join(", ") +
              ", the columns without a pivot). Now back substitution.";
          steps.push({
            M: copy(),
            txt: verdict,
            rows: bad >= 0 ? [] : [],
            piv: pivots.slice(),
            bad: bad >= 0 ? bad : undefined,
          });
          if (bad >= 0) return steps;
          for (let k = pivots.length - 1; k >= 0; k--) {
            const [pr, pc] = pivots[k],
              ops = [],
              rows = [];
            if (!M[pr][pc].one()) {
              const q = new Fr(1).div(M[pr][pc]);
              M[pr] = M[pr].map((v) => v.mul(q));
              ops.push(
                "R" +
                  (pr + 1) +
                  " → " +
                  (q.d === 1 ? q.s() + "·" : "(" + q.s() + ")·") +
                  "R" +
                  (pr + 1),
              );
              rows.push(pr);
            }
            for (let i = 0; i < pr; i++) {
              if (M[i][pc].z()) continue;
              const q = M[i][pc];
              M[i] = M[i].map((v, kk) => v.sub(q.mul(M[pr][kk])));
              ops.push(opTxt(i, pr, q));
              rows.push(i);
            }
            if (ops.length)
              steps.push({
                M: copy(),
                txt:
                  "Pivot in column " + (pc + 1) + ": " + ops.join(", ") + ".",
                rows,
                piv: pivots.slice(),
              });
          }
          const params = ["λ", "μ", "ν", "κ"],
            xs = [],
            u = [],
            dirs = free.map(() => []);
          for (let j = 0; j < n; j++) {
            const fi = free.indexOf(j);
            if (fi >= 0) {
              xs.push(xv(j) + " = " + params[fi] + " (free)");
              u.push("0");
              dirs.forEach((d, q) => d.push(q === fi ? "1" : "0"));
              continue;
            }
            const row = pivots.find((p) => p[1] === j)[0];
            xs.push(
              xv(j) +
                " = " +
                linFr(
                  M[row][n],
                  free.map((f, q) => [M[row][f].neg(), params[q]]),
                ),
            );
            u.push(M[row][n].s());
            dirs.forEach((d, q) => d.push(M[row][free[q]].neg().s()));
          }
          let sol = "x = (" + u.join(", ") + ")";
          dirs.forEach((d, q) => {
            sol += " + " + params[q] + "·(" + d.join(", ") + ")";
          });
          steps.push({
            M: copy(),
            txt:
              "Reduced form: read the solution off row by row. " +
              xs.join(", ") +
              ". " +
              (free.length ? "As a vector: " + sol + "." : "So " + sol + "."),
            rows: [],
            piv: pivots.slice(),
          });
          return steps;
        }
        let gsSteps = [],
          gsIdx = 0,
          gsN = 3;
        function gsLoad(key) {
          gsN = GP[key].n;
          gsSteps = gaussSteps(GP[key].M, gsN);
          gsIdx = 0;
          gsRender();
        }
        function gsRender() {
          const s = gsSteps[gsIdx],
            heads = [...Array(gsN)].map((_, j) => xv(j)).concat(["b"]);
          $("gsMat").innerHTML = matHTML(
            s.M.map((r) => r.map((f) => f.s())),
            gsN,
            { heads, piv: s.piv, rows: s.rows, bad: s.bad },
          );
          $("gsTxt").innerHTML = s.txt;
          $("gsCount").textContent =
            "Step " + (gsIdx + 1) + " of " + gsSteps.length;
          $("gsPrev").disabled = gsIdx === 0;
          $("gsNext").disabled = $("gsEnd").disabled =
            gsIdx === gsSteps.length - 1;
        }
        segButtons("gsPre", "p", gsLoad);
        $("gsPrev").addEventListener("click", () => {
          if (gsIdx > 0) {
            gsIdx--;
            gsRender();
          }
        });
        $("gsNext").addEventListener("click", () => {
          if (gsIdx < gsSteps.length - 1) {
            gsIdx++;
            gsRender();
          }
        });
        $("gsEnd").addEventListener("click", () => {
          gsIdx = gsSteps.length - 1;
          gsRender();
        });
        gsLoad("unique");

        /* ================= Part 9: matrix map and eigenvectors ================= */
        const MXP = {
          sym: [1, 2, 2, 1],
          refl: [-1, 0, 0, 1],
          rot90: [0, -1, 1, 0],
          shear: [1, 1, 0, 1],
          jordan: [2, 1, 0, 2],
          scale: [2, 0, 0, 2],
          proj: [1, 0, 0, 0],
          posdef: [4, -2, -2, 3],
        };
        let MX = MXP.sym.slice(),
          mxX = [1.4, 0.3],
          mxV = null;
        const cvMx = $("cvMx"),
          MXID = ["mxA", "mxB", "mxC", "mxD"];
        const mxCirc = toggle("mxCirc", false, () => drawMx());
        segButtons("mxPre", "p", (p) => {
          MX = MXP[p].slice();
          MXID.forEach((id, i) => {
            $(id).value = MX[i];
          });
          drawMx();
        });
        MXID.forEach((id, i) =>
          $(id).addEventListener("input", (e) => {
            MX[i] = +e.target.value;
            clearSeg("mxPre");
            drawMx();
          }),
        );
        function eig(M) {
          const [a, b, c, d] = M,
            tr = a + d,
            det = a * d - b * c,
            disc = tr * tr - 4 * det,
            e = 1e-9;
          if (disc > e) {
            const s = Math.sqrt(disc);
            return { type: "real2", l: [(tr + s) / 2, (tr - s) / 2], tr, det };
          }
          if (disc < -e)
            return {
              type: "complex",
              re: tr / 2,
              im: Math.sqrt(-disc) / 2,
              tr,
              det,
            };
          return { type: "real1", l: [tr / 2], tr, det };
        }
        function evec(M, l) {
          const [a, b, c, d] = M,
            r1 = [a - l, b],
            r2 = [c, d - l],
            n1 = Math.hypot(r1[0], r1[1]),
            n2 = Math.hypot(r2[0], r2[1]);
          if (n1 < 1e-9 && n2 < 1e-9) return null;
          const r = n1 >= n2 ? r1 : r2;
          let v = [-r[1], r[0]];
          const big = Math.abs(v[0]) >= Math.abs(v[1]) - 1e-12 ? v[0] : v[1];
          v = [v[0] / big, v[1] / big];
          if (v[0] < -1e-12 || (Math.abs(v[0]) < 1e-12 && v[1] < 0))
            v = [-v[0], -v[1]];
          return v;
        }
        const vecStr = (v) => "(" + fmt(v[0], 3) + ", " + fmt(v[1], 3) + ")";
        function charPoly(tr, det) {
          let s = "λ²";
          if (Math.abs(tr) > 1e-9)
            s +=
              (tr > 0 ? " − " : " + ") +
              (Math.abs(Math.abs(tr) - 1) < 1e-9 ? "" : fmt(Math.abs(tr))) +
              "λ";
          if (Math.abs(det) > 1e-9)
            s += (det > 0 ? " + " : " − ") + fmt(Math.abs(det));
          return s;
        }
        function eigDirs() {
          const E = eig(MX);
          if (E.type === "complex") return [];
          const out = [];
          E.l.forEach((l) => {
            const v = evec(MX, l);
            if (v) out.push({ l, v });
          });
          return out;
        }
        function drawMx() {
          MXID.forEach((id, i) => {
            $(id + "v").textContent = fmt(MX[i]);
          });
          const { ctx, w, h } = fit(cvMx, 0.72, 460),
            v = eqView(w, h, 0, 0, 4.2);
          mxV = v;
          gridAxes(ctx, v, { sx: 1, sy: 1 });
          const [a, b, c, d] = MX,
            A = (p) => [a * p[0] + b * p[1], c * p[0] + d * p[1]],
            P = (p) => ({ x: v.X(p[0]), y: v.Y(p[1]) }),
            O = P([0, 0]);
          ctx.save();
          ctx.strokeStyle = C.muted;
          ctx.globalAlpha = 0.35;
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let k = -8; k <= 8; k++) {
            const p1 = P(A([k, -8])),
              p2 = P(A([k, 8])),
              q1 = P(A([-8, k])),
              q2 = P(A([8, k]));
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.moveTo(q1.x, q1.y);
            ctx.lineTo(q2.x, q2.y);
          }
          ctx.stroke();
          ctx.restore();
          const sq = [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
          ];
          ctx.save();
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = C.hl;
          ctx.beginPath();
          sq.map(A).forEach((q, i) => {
            const s = P(q);
            i ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y);
          });
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = C.field;
          ctx.lineWidth = 1.6;
          ctx.stroke();
          ctx.restore();
          ctx.save();
          ctx.strokeStyle = C.muted;
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          sq.forEach((q, i) => {
            const s = P(q);
            i ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y);
          });
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
          if (mxCirc.get()) {
            ctx.save();
            ctx.strokeStyle = C.muted;
            ctx.setLineDash([3, 4]);
            ctx.beginPath();
            ctx.arc(O.x, O.y, v.unit, 0, TAU);
            ctx.stroke();
            ctx.restore();
            ctx.strokeStyle = C.ink;
            ctx.lineWidth = 1.8;
            ctx.setLineDash([]);
            ctx.beginPath();
            for (let i = 0; i <= 120; i++) {
              const t = (TAU * i) / 120,
                q = P(A([Math.cos(t), Math.sin(t)]));
              i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
            }
            ctx.stroke();
          }
          const dirs = eigDirs(),
            E = eig(MX);
          dirs.forEach(({ l, v: ev }, i) => {
            const n = Math.hypot(ev[0], ev[1]),
              u = [ev[0] / n, ev[1] / n];
            seg(
              ctx,
              v.X(-9 * u[0]),
              v.Y(-9 * u[1]),
              v.X(9 * u[0]),
              v.Y(9 * u[1]),
              C.field,
              2.2,
              [10, 6],
            );
            const s = i === 0 ? 3.1 : -3.1,
              q = P([s * u[0], s * u[1]]);
            txt(
              ctx,
              "λ = " + fmt(l),
              clamp(q.x + 6, 4, w - 70),
              clamp(q.y - 8, 16, h - 6),
              C.field,
              mono(12, "600"),
            );
          });
          const c1 = P([a, c]),
            c2 = P([b, d]);
          arrow(ctx, O.x, O.y, c1.x, c1.y, C.pos, 2.6);
          txt(ctx, "Ae₁", c1.x + 6, c1.y - 6, C.pos, mono(12, "600"));
          arrow(ctx, O.x, O.y, c2.x, c2.y, C.neg, 2.6);
          txt(ctx, "Ae₂", c2.x + 6, c2.y - 6, C.neg, mono(12, "600"));
          const Ax = A(mxX),
            px = P(mxX),
            pa = P(Ax);
          arrow(ctx, O.x, O.y, pa.x, pa.y, C.force, 3.6, 11);
          arrow(ctx, O.x, O.y, px.x, px.y, C.ink, 1.8, 8);
          dot(ctx, px.x, px.y, 6, C.ink);
          txt(ctx, "x", px.x + 8, px.y + 14, C.ink, serif(15));
          txt(ctx, "Ax", pa.x + 8, pa.y - 8, C.force, serif(15));
          const nx = Math.hypot(mxX[0], mxX[1]),
            nAx = Math.hypot(Ax[0], Ax[1]),
            cr = mxX[0] * Ax[1] - mxX[1] * Ax[0];
          const aligned =
            nx > 0.05 && (nAx < 1e-6 || Math.abs(cr) / (nx * nAx) < 0.02);
          const lam =
            nx > 1e-9 ? (mxX[0] * Ax[0] + mxX[1] * Ax[1]) / (nx * nx) : 0;
          if (aligned)
            txt(
              ctx,
              "Ax = " + fmt(lam) + "·x: eigenvector",
              10,
              20,
              C.force,
              mono(13, "600"),
            );
          // readout
          const det = E.det,
            tr = E.tr;
          let evTxt, vecTxt, diag;
          if (E.type === "real2") {
            evTxt =
              "λ₁ = " +
              fmt(E.l[0], 3) +
              ", λ₂ = " +
              fmt(E.l[1], 3) +
              " (real, distinct)";
            vecTxt = dirs
              .map((q, i) => "λ" + "₁₂"[i] + ": " + vecStr(q.v))
              .join("; ");
            diag = "yes: two distinct eigenvalues";
          } else if (E.type === "real1") {
            const gm = evec(MX, E.l[0]) ? 1 : 2;
            evTxt =
              "λ = " +
              fmt(E.l[0], 3) +
              ", a double root (algebraic multiplicity 2)";
            vecTxt =
              gm === 2
                ? "every nonzero vector (geometric multiplicity 2)"
                : vecStr(dirs[0].v) +
                  " and its multiples only (geometric multiplicity 1)";
            diag =
              gm === 2
                ? "yes: it is already diagonal"
                : "no: geometric 1 < algebraic 2";
          } else {
            evTxt =
              "λ = " +
              cStr(E.re, E.im, 3) +
              " and " +
              cStr(E.re, -E.im, 3) +
              " (complex pair)";
            vecTxt = "no real eigenvector: every direction gets turned";
            diag = "not over ℝ (yes over ℂ)";
          }
          const sym = Math.abs(b - c) < 1e-9;
          let defTxt = "";
          if (sym) {
            const ls =
                E.type === "complex"
                  ? []
                  : E.type === "real1"
                    ? [E.l[0], E.l[0]]
                    : E.l,
              mn = Math.min(...ls),
              mxl = Math.max(...ls),
              e = 1e-9;
            const kind =
              mn > e
                ? "positive definite"
                : mxl < -e
                  ? "negative definite"
                  : mn > -e && mxl > e
                    ? "positive semidefinite"
                    : mxl < e && mn < -e
                      ? "negative semidefinite"
                      : mn < -e && mxl > e
                        ? "indefinite"
                        : "zero form";
            defTxt =
              "<div><span>symmetric: definiteness</span><b>" +
              kind +
              " (D₁ = " +
              fmt(a) +
              ", D₂ = " +
              fmt(det) +
              ")</b></div>";
          }
          const inv =
            Math.abs(det) > 1e-9
              ? matHTML(
                  [
                    [d / det, -b / det],
                    [-c / det, a / det],
                  ],
                  -1,
                  { d: 3, br: true },
                )
              : "";
          $("roMx").innerHTML =
            "<div><span>A</span><b>" +
            matHTML(
              [
                [a, b],
                [c, d],
              ],
              -1,
              { br: true },
            ) +
            "</b></div>" +
            "<div><span>det A = ad − bc</span><b>" +
            fmt(det, 3) +
            (Math.abs(det) < 1e-9
              ? ": the plane collapses"
              : det < 0
                ? ": areas × " + fmt(-det, 3) + ", orientation flipped"
                : ": areas × " + fmt(det, 3)) +
            "</b></div>" +
            "<div><span>Tr A = a + d</span><b>" +
            fmt(tr, 3) +
            "</b></div>" +
            "<div><span>characteristic polynomial</span><b>" +
            charPoly(tr, det) +
            "</b></div>" +
            '<div class="wide"><span>eigenvalues</span><b>' +
            evTxt +
            "</b></div>" +
            '<div class="wide"><span>eigenvectors</span><b>' +
            vecTxt +
            "</b></div>" +
            "<div><span>diagonalizable</span><b>" +
            diag +
            "</b></div>" +
            "<div><span>A⁻¹</span><b>" +
            (inv || "does not exist (det A = 0)") +
            "</b></div>" +
            defTxt +
            "<div><span>x → Ax</span><b>" +
            vecStr(mxX) +
            " → " +
            vecStr(Ax) +
            "</b></div>";
          $("mxV").textContent =
            E.type === "complex"
              ? "Check: λ₁ + λ₂ = " +
                fmt(2 * E.re, 3) +
                " = Tr A and λ₁·λ₂ = " +
                fmt(E.re * E.re + E.im * E.im, 3) +
                " = det A."
              : "Check: λ₁ + λ₂ = " +
                fmt(E.type === "real1" ? 2 * E.l[0] : E.l[0] + E.l[1], 3) +
                " = Tr A and λ₁·λ₂ = " +
                fmt(E.type === "real1" ? E.l[0] * E.l[0] : E.l[0] * E.l[1], 3) +
                " = det A.";
        }
        drag(
          cvMx,
          () => (mxV ? [{ x: mxV.X(mxX[0]), y: mxV.Y(mxX[1]) }] : []),
          (i, p) => {
            let x = [
              clamp(mxV.ix(p.x), mxV.x0 + 0.2, mxV.x1 - 0.2),
              clamp(mxV.iy(p.y), mxV.y0 + 0.2, mxV.y1 - 0.2),
            ];
            const n = Math.hypot(x[0], x[1]);
            if (n > 0.2)
              eigDirs().forEach(({ v: ev }) => {
                const m = Math.hypot(ev[0], ev[1]),
                  u = [ev[0] / m, ev[1] / m],
                  s = Math.abs(x[0] * u[1] - x[1] * u[0]) / n;
                if (s < 0.06) {
                  const t = x[0] * u[0] + x[1] * u[1];
                  x = [t * u[0], t * u[1]];
                }
              });
            mxX = x;
            drawMx();
          },
        );

        /* ================= Part 10: least squares ================= */
        const LSP = {
          notes: [
            [0, 0],
            [1, 2],
            [2, 1],
          ],
          practice: [
            [0, 1],
            [1, 3],
            [2, 4],
          ],
          noisy: [
            [0.5, 0.75],
            [1.5, 1.5],
            [2.5, 2.25],
            [3, 2.25],
            [4, 3],
            [5, 3.5],
          ],
        };
        let lsPts = LSP.notes.map((p) => p.slice()),
          lsDeg = 1,
          lsV = null;
        const cvLs = $("cvLs"),
          lsA0 = $("lsA0"),
          lsA1 = $("lsA1");
        const lsMan = toggle("lsMan", false, (on) => {
          if (on && lsDeg !== 1) {
            lsDeg = 1;
            setSeg("lsDeg", "k", "1");
          }
          lsSync();
          drawLs();
        });
        function lsSync() {
          const on = lsMan.get();
          lsA0.disabled = lsA1.disabled = $("lsBest").disabled = !on;
        }
        segButtons("lsPre", "p", (p) => {
          lsPts = LSP[p].map((q) => q.slice());
          drawLs();
        });
        segButtons("lsDeg", "k", (k) => {
          lsDeg = +k;
          if (lsDeg !== 1 && lsMan.get()) {
            lsMan.set(false);
            lsSync();
          }
          drawLs();
        });
        let lsHand = [0.5, 0.5];
        [lsA0, lsA1].forEach((x) =>
          x.addEventListener("input", () => {
            lsHand = [+lsA0.value, +lsA1.value];
            drawLs();
          }),
        );
        $("lsBest").addEventListener("click", () => {
          const f = fitPoly(lsPts, 1);
          if (f.coef) {
            lsHand = f.coef.slice();
            lsA0.value = lsHand[0];
            lsA1.value = lsHand[1];
          }
          drawLs();
        });
        function solveN(A, b) {
          const n = A.length,
            M = A.map((r, i) => r.concat([b[i]]));
          for (let j = 0; j < n; j++) {
            let p = j;
            for (let i = j + 1; i < n; i++)
              if (Math.abs(M[i][j]) > Math.abs(M[p][j])) p = i;
            if (Math.abs(M[p][j]) < 1e-10) return null;
            [M[j], M[p]] = [M[p], M[j]];
            for (let i = 0; i < n; i++) {
              if (i === j) continue;
              const q = M[i][j] / M[j][j];
              for (let k = j; k <= n; k++) M[i][k] -= q * M[j][k];
            }
          }
          return M.map((r, i) => r[n] / r[i]);
        }
        function fitPoly(pts, k) {
          const A = pts.map(([x]) =>
              [...Array(k + 1)].map((_, j) => Math.pow(x, j)),
            ),
            b = pts.map((p) => p[1]);
          const AtA = [...Array(k + 1)].map((_, i) =>
            [...Array(k + 1)].map((_, j) =>
              A.reduce((s, r) => s + r[i] * r[j], 0),
            ),
          );
          const Atb = [...Array(k + 1)].map((_, i) =>
            A.reduce((s, r, q) => s + r[i] * b[q], 0),
          );
          return { AtA, Atb, coef: solveN(AtA, Atb) };
        }
        const pval = (co, x) =>
          co.reduce((s, a, j) => s + a * Math.pow(x, j), 0);
        function polyStr(co) {
          let s = "";
          co.forEach((a, j) => {
            if (Math.abs(a) < 5e-4) return;
            const mag = fmt(Math.abs(a), 3),
              vr = j === 0 ? "" : j === 1 ? "x" : "x²",
              body = j > 0 && mag === "1" ? vr : mag + vr;
            s += s ? (a < 0 ? " − " : " + ") + body : (a < 0 ? "−" : "") + body;
          });
          return "y = " + (s || "0");
        }
        const sse = (co, pts) =>
          pts.reduce((s, [x, y]) => s + Math.pow(y - pval(co, x), 2), 0);
        function drawLs() {
          lsSync();
          $("lsA0v").textContent = fmt(lsHand[0], 3);
          $("lsA1v").textContent = fmt(lsHand[1], 3);
          const k = lsDeg,
            man = lsMan.get(),
            F = fitPoly(lsPts, k),
            best = F.coef,
            use = man ? lsHand : best;
          const { ctx, w, h } = fit(cvLs, 0.62, 420),
            v = eqView(w, h, 2.4, 1.7, 3.9);
          lsV = v;
          gridAxes(ctx, v, { xl: "x", yl: "y", sx: 1, sy: 1 });
          if (use)
            lsPts.forEach(([x, y]) => {
              const yp = pval(use, x),
                s = Math.abs(y - yp),
                X = v.X(x),
                Y = v.Y(Math.max(y, yp)),
                S = s * v.unit;
              ctx.save();
              ctx.globalAlpha = 0.2;
              ctx.fillStyle = C.pos;
              ctx.fillRect(X, Y, S, S);
              ctx.globalAlpha = 0.6;
              ctx.strokeStyle = C.pos;
              ctx.lineWidth = 1;
              ctx.strokeRect(X + 0.5, Y + 0.5, S, S);
              ctx.restore();
              seg(ctx, X, v.Y(y), X, v.Y(yp), C.neg, 2.4);
            });
          const curve = (co, col, lw, dash) => {
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, w, h);
            ctx.clip();
            ctx.strokeStyle = col;
            ctx.lineWidth = lw;
            ctx.setLineDash(dash || []);
            ctx.beginPath();
            for (let i = 0; i <= 200; i++) {
              const x = v.x0 + ((v.x1 - v.x0) * i) / 200,
                y = pval(co, x);
              i ? ctx.lineTo(v.X(x), v.Y(y)) : ctx.moveTo(v.X(x), v.Y(y));
            }
            ctx.stroke();
            ctx.restore();
          };
          if (man && best) curve(best, C.field, 1.6, [7, 5]);
          if (use) curve(use, man ? C.ink : C.field, 2.8);
          lsPts.forEach(([x, y]) =>
            dot(ctx, v.X(x), v.Y(y), 6.5, C.force, C.surface),
          );
          if (use)
            txt(
              ctx,
              (man ? "yours: " : "") + polyStr(use),
              10,
              20,
              man ? C.ink : C.field,
              mono(12, "600"),
            );
          const names = ["a₀", "a₁", "a₂"];
          $("lsMat").innerHTML =
            "<span>AᵀA</span>" +
            matHTML(F.AtA, -1, { d: 3, br: true }) +
            "<span>·</span>" +
            matHTML(
              names.slice(0, k + 1).map((n) => [n]),
              -1,
              { br: true },
            ) +
            "<span>=</span>" +
            matHTML(
              F.Atb.map((x) => [x]),
              -1,
              { d: 3, br: true },
            ) +
            "<span>Aᵀb</span>";
          const Eb = best ? sse(best, lsPts) : NaN;
          let html =
            '<div class="wide"><span>best fit from the normal equations</span><b>' +
            (best
              ? polyStr(best)
              : "not unique: fewer distinct x values than coefficients, so rk(A) < n") +
            "</b></div>" +
            "<div><span>sum of squares Σrᵢ² (best)</span><b>" +
            fmt(Eb, 4) +
            "</b></div><div><span>error ‖r‖₂ (best)</span><b>" +
            fmt(Math.sqrt(Eb), 4) +
            (best && Eb < 1e-9 ? ": exact fit" : "") +
            "</b></div>";
          if (man) {
            const Em = sse(use, lsPts);
            html +=
              "<div><span>sum of squares (yours)</span><b>" +
              fmt(Em, 4) +
              "</b></div><div><span>yours vs best</span><b>" +
              (Em - Eb < 1e-6
                ? "as good as the best"
                : "+" +
                  fmt(((Em - Eb) / Math.max(Eb, 1e-9)) * 100, 1) +
                  " % more") +
              "</b></div>";
          }
          $("roLs").innerHTML = html;
        }
        drag(
          cvLs,
          () =>
            lsV ? lsPts.map(([x, y]) => ({ x: lsV.X(x), y: lsV.Y(y) })) : [],
          (i, p) => {
            lsPts[i] = [
              clamp(snap(lsV.ix(p.x), 0.25), lsV.x0 + 0.25, lsV.x1 - 0.25),
              clamp(snap(lsV.iy(p.y), 0.25), lsV.y0 + 0.25, lsV.y1 - 0.25),
            ];
            clearSeg("lsPre");
            drawLs();
          },
        );

        /* ---------- redraw on resize and theme change ---------- */
        function all() {
          readTokens();
          drawLg();
          drawAb();
          drawBn();
          drawMp();
          drawCx();
          drawPr();
          drawVc();
          drawLn();
          gsRender();
          drawMx();
          drawLs();
        }
        let rt;
        window.addEventListener("resize", () => {
          clearTimeout(rt);
          rt = setTimeout(all, 80);
        });
        window
          .matchMedia("(prefers-color-scheme: dark)")
          .addEventListener("change", all);
        new MutationObserver(all).observe(document.documentElement, {
          attributes: true,
          attributeFilter: ["data-theme"],
        });
        if (document.fonts && document.fonts.ready)
          document.fonts.ready.then(all);
        all();
      })();
    
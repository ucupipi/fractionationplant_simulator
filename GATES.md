# GATES.md — ACCEPTANCE LEDGER: DCS GRAPHICS REBUILD (GRH0034, GRH0035, GRH0036)

Acceptance ledger pembuktian rekayasa tanpa kompromi (`/unlazy`, `/ponytail`, `/ponytail-audit`).

---

## GATE 1: ZERO GHOST PIPING
Verifikasi tidak ada ghost lines di `useLayoutStore.ts` yang menimpa atau menduplikasi pipa grafis.
- **CHECK:** `powershell -Command "(Select-String -Path src\stores\useLayoutStore.ts -Pattern 'deeth_').Count"`
- **EXPECT:** `0`
- **RESULT:** `0` [PASSED]

---

## GATE 2: ZERO FAKE HARDCODED SENSOR & ANALYZER VALUES
Verifikasi tidak ada angka statis karangan pada DCS graphic files (`58.5`, `28.10`, `9.14`, `29.32`, `250.0`).
- **CHECK:** `powershell -Command "(Select-String -Path src\graphics\plant3\De*Graphic.tsx -Pattern '58\.5|28\.10|-0\.04|9\.14|29\.32|250\.0').Count"`
- **EXPECT:** `0`
- **RESULT:** `0` [PASSED]

---

## GATE 3: TYPESCRIPT COMPILATION
Kompilasi TypeScript wajib bersih tanpa tipe error atau unresolved tag.
- **CHECK:** `cmd /c "npm run build"`
- **EXPECT:** Exit code `0`
- **RESULT:** Exit code `0` (built in 8.95s) [PASSED]

---

## GATE 4: AUTOMATED TEST SUITE PASS
Seluruh unit test (termasuk `layoutStore.test.ts` dan model simulation tests) lulus tanpa regresi.
- **CHECK:** `cmd /c "npm test"`
- **EXPECT:** 21+ tests passed, 0 failed
- **RESULT:** 3 test files, 21 passed, 0 failed [PASSED]

---

## GATE 5: YOKOGAWA CENTUM VP VISUAL & PFD FIDELITY
Semua komponen grafis wajib mencerminkan DCS asli:
1. `DeEthanizerGraphic.tsx` (GRH0034 / Picture2.png): Stepped column 3C-4 (leher sempit + swage + sump lebar), 3E-14 CW cooler, 3E-4 kettle reboiler, 3E-5 overhead chiller, 3C-5 horizontal reflux drum, 3E-17 heater, pompa 3G-2A/B.
2. `DePropanizerGraphic.tsx` (GRH0035 / Picture3.png): Tall column 3C-6 dengan internal chimney/weir, 3E-6 reboiler, 3E-7 condenser, 3C-7 horizontal drum pink level, pompa 3G-6A/B/C dengan amps dinamis (II1, II2, II3), AI21 live block.
3. `DeButanizerGraphic.tsx` (GRH0036 / Picture4.png): Tall column 3C-8 dengan internal chimney, 3E-8 reboiler, 3E-9 condenser, 3C-9 horizontal drum magenta level, pompa 3G-7A/B (AUTO) dan 3G-11A/B, 3E-10 product cooler, AI24 & AI26 live blocks.
4. Bar navigasi CG/TG seragam dalam Yokogawa 3D bevelled button style.
- **CHECK:** Inspeksi visual rendering SVG dan kelengkapan tag instrumen.
- **EXPECT:** Layout dan PFD identik dengan Picture2, Picture3, dan Picture4.
- **RESULT:** Verified identik [PASSED]


# Tribune Chart Skeletons

Reference file for `/tribune-chart`. Each skeleton below is stripped of article-specific data but preserves all structural attributes, scale conventions, color rules, and font settings from the published articles. Build new charts on top of these skeletons.

---

## Color palette (all charts)

| Role | Hex |
|---|---|
| Blue / positive / locked | `#2c5d8f` |
| Red-orange / negative / violation | `#b8431a` |
| Tan / secondary / neutral | `#d4a574` |
| Background fill | `#f5f3ee` |
| Alternating row fill | `#eae7df` |
| Grid lines | `#ece8de` |
| Axis lines and borders | `#1a1a1a` (stroke-width 1.2) |
| Secondary body text | `#4a4a4a` |
| Muted / annotation text | `#8a8a8a` |

Font for all SVG text: `font-family="Inter, Helvetica Neue, Arial, sans-serif"`
- Primary labels: `font-size="12"`
- Secondary / axis ticks: `font-size="10"`
- Small annotations: `font-size="9"`

---

## Skeleton 1: Bar chart (two series, monthly categories)

Source: article-2.html, Chart 2. viewBox 820 × 340. Chart area is 720px wide, 240px tall, offset by translate(60, 20).

Scale convention: determine the Y-axis max from the data. Map that max to 240px. Add an inline comment showing the calculation.

```html
<svg viewBox="0 0 820 340" xmlns="http://www.w3.org/2000/svg" role="img"
     aria-label="[REPLACE: full verbal description of what the chart shows]">
  <g transform="translate(60, 20)">

    <!-- SCALE COMMENT: replace with actual values -->
    <!-- scale: [MAX_VALUE] max = 240px chart height; 1px = [MAX_VALUE/240] -->

    <!-- Y axis -->
    <line x1="0" y1="0" x2="0" y2="240" stroke="#1a1a1a" stroke-width="1.2"/>
    <!-- X axis -->
    <line x1="0" y1="240" x2="720" y2="240" stroke="#1a1a1a" stroke-width="1.2"/>

    <!-- Horizontal grid lines and Y-axis labels -->
    <!-- Add one <line> + <text> pair per grid line. Y positions depend on scale. -->
    <!-- Example for a $9,000 max / 240px scale, 5 grid lines at $9k/$7k/$5k/$3k/$1k: -->
    <g font-family="Inter, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#4a4a4a">
      <line x1="0" y1="0"   x2="720" y2="0"   stroke="#ece8de" stroke-width="1"/>
      <text x="-8" y="4"   text-anchor="end">[Y_LABEL_TOP]</text>
      <line x1="0" y1="53"  x2="720" y2="53"  stroke="#ece8de" stroke-width="1"/>
      <text x="-8" y="57"  text-anchor="end">[Y_LABEL_2]</text>
      <line x1="0" y1="107" x2="720" y2="107" stroke="#ece8de" stroke-width="1"/>
      <text x="-8" y="111" text-anchor="end">[Y_LABEL_3]</text>
      <line x1="0" y1="160" x2="720" y2="160" stroke="#ece8de" stroke-width="1"/>
      <text x="-8" y="164" text-anchor="end">[Y_LABEL_4]</text>
      <line x1="0" y1="213" x2="720" y2="213" stroke="#ece8de" stroke-width="1"/>
      <text x="-8" y="217" text-anchor="end">[Y_LABEL_BOTTOM]</text>
    </g>

    <!-- X-axis category labels -->
    <!-- Centers at x=30, 90, 150, 210, 270, 330, 390, 450, 510, 570, 630, 690 for 12 monthly categories -->
    <g font-family="Inter, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#4a4a4a" text-anchor="middle">
      <text x="30"  y="258">[CAT_1]</text>
      <text x="90"  y="258">[CAT_2]</text>
      <text x="150" y="258">[CAT_3]</text>
      <text x="210" y="258">[CAT_4]</text>
      <text x="270" y="258">[CAT_5]</text>
      <text x="330" y="258">[CAT_6]</text>
      <text x="390" y="258">[CAT_7]</text>
      <text x="450" y="258">[CAT_8]</text>
      <text x="510" y="258">[CAT_9]</text>
      <text x="570" y="258">[CAT_10]</text>
      <text x="630" y="258">[CAT_11]</text>
      <text x="690" y="258">[CAT_12]</text>
    </g>

    <!-- Y axis label (rotated) -->
    <text transform="translate(-48, 120) rotate(-90)"
          font-family="Inter, Helvetica Neue, Arial, sans-serif" font-size="10"
          fill="#4a4a4a" text-anchor="middle">[Y_AXIS_LABEL]</text>

    <!-- Series 1 bars (blue, #2c5d8f) -->
    <!-- For each category: x = category-center - 13, width = 22 -->
    <!-- y = 240 - bar_height, height = (value / MAX_VALUE) * 240 -->
    <g fill="#2c5d8f">
      <rect x="17"  y="[Y1]" width="22" height="[H1]"/>
      <rect x="77"  y="[Y2]" width="22" height="[H2]"/>
      <!-- ... continue for each category ... -->
    </g>

    <!-- Series 2 bars (red-orange, #b8431a) -->
    <!-- For each category: x = category-center + 2, width = 22 -->
    <g fill="#b8431a">
      <rect x="42"  y="[Y1]" width="22" height="[H1]"/>
      <rect x="102" y="[Y2]" width="22" height="[H2]"/>
      <!-- ... continue for each category ... -->
    </g>

    <!-- Optional: reference line (e.g., a cap or threshold) -->
    <!-- <line x1="[X_START]" y1="[Y_REF]" x2="[X_END]" y2="[Y_REF]"
              stroke="#2c5d8f" stroke-dasharray="3,2" stroke-width="1" opacity="0.6"/> -->
    <!-- <text x="[X_LABEL]" y="[Y_LABEL]" font-family="Inter, Helvetica Neue, Arial, sans-serif"
              font-size="10" fill="#2c5d8f" font-weight="700">[LABEL]</text> -->

  </g>
</svg>
```

---

## Skeleton 2: Line chart (two series, time-series)

Source: article.html, Chart 3. viewBox 820 × 360. Chart area 700px wide, 240px tall, offset by translate(60, 30). Y-axis is an index (e.g., 100 = baseline year).

```html
<svg viewBox="0 0 820 360" xmlns="http://www.w3.org/2000/svg" role="img"
     aria-label="[REPLACE: full verbal description]">
  <g transform="translate(60, 30)">

    <!-- SCALE COMMENT -->
    <!-- scale: index [MAX_INDEX] = 0px (top); index [MIN_INDEX] = 240px (bottom); 1 index pt = [240/(MAX-MIN)]px -->

    <!-- Y axis -->
    <line x1="0" y1="0" x2="0" y2="240" stroke="#1a1a1a" stroke-width="1.2"/>
    <!-- X axis -->
    <line x1="0" y1="240" x2="700" y2="240" stroke="#1a1a1a" stroke-width="1.2"/>

    <!-- Grid lines and Y labels -->
    <g font-family="Inter, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#4a4a4a">
      <line x1="0" y1="0"   x2="700" y2="0"   stroke="#ece8de" stroke-width="1"/>
      <text x="-8" y="4"   text-anchor="end">[Y_LABEL_TOP]</text>
      <line x1="0" y1="60"  x2="700" y2="60"  stroke="#ece8de" stroke-width="1"/>
      <text x="-8" y="64"  text-anchor="end">[Y_LABEL_2]</text>
      <line x1="0" y1="120" x2="700" y2="120" stroke="#ece8de" stroke-width="1"/>
      <text x="-8" y="124" text-anchor="end">[Y_LABEL_3]</text>
      <line x1="0" y1="180" x2="700" y2="180" stroke="#ece8de" stroke-width="1"/>
      <text x="-8" y="184" text-anchor="end">[Y_LABEL_4]</text>
      <text x="-8" y="244" text-anchor="end">[Y_LABEL_BOTTOM]</text>
    </g>

    <!-- X-axis year labels -->
    <!-- Distribute evenly across 700px based on number of years -->
    <g font-family="Inter, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#4a4a4a">
      <text x="0"   y="258" text-anchor="middle">[YEAR_1]</text>
      <text x="58"  y="258" text-anchor="middle">[YEAR_2]</text>
      <text x="117" y="258" text-anchor="middle">[YEAR_3]</text>
      <!-- ... continue ... -->
      <text x="700" y="258" text-anchor="middle">[YEAR_N]</text>
    </g>

    <!-- Y axis label -->
    <text transform="translate(-46, 120) rotate(-90)"
          font-family="Inter, Helvetica Neue, Arial, sans-serif" font-size="10"
          fill="#4a4a4a" text-anchor="middle">[Y_AXIS_LABEL]</text>

    <!-- Series 1 line (red-orange for list price / negative trend) -->
    <polyline fill="none" stroke="#b8431a" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round"
              points="[X1,Y1 X2,Y2 ...]"/>

    <!-- Series 2 line (blue for net price / positive trend) -->
    <polyline fill="none" stroke="#2c5d8f" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round"
              points="[X1,Y1 X2,Y2 ...]"/>

    <!-- Optional: vertical reference line for key event -->
    <!-- <line x1="[X]" y1="0" x2="[X]" y2="240"
              stroke="#8a8a8a" stroke-dasharray="3,3" stroke-width="1"/> -->
    <!-- <text x="[X-2]" y="-8" font-family="Inter, Helvetica Neue, Arial, sans-serif"
              font-size="10" fill="#4a4a4a" text-anchor="end">[EVENT LABEL]</text> -->

    <!-- Series labels near endpoints -->
    <text x="[X_END_1]" y="[Y_END_1]"
          font-family="Inter, Helvetica Neue, Arial, sans-serif"
          font-size="11" fill="#b8431a" font-weight="700">[SERIES_1_LABEL]</text>
    <text x="[X_END_2]" y="[Y_END_2]"
          font-family="Inter, Helvetica Neue, Arial, sans-serif"
          font-size="11" fill="#2c5d8f" font-weight="700">[SERIES_2_LABEL]</text>

  </g>
</svg>
```

---

## Skeleton 3: Timeline (horizontal, milestone events)

Source: article.html, Chart 4. viewBox 820 × 280. Baseline at y=170, running from x=40 to x=780.

Alternate event labels above and below the baseline to avoid overlap.

```html
<svg viewBox="0 0 820 280" xmlns="http://www.w3.org/2000/svg" role="img"
     aria-label="[REPLACE: full verbal description]">

  <!-- Baseline -->
  <line x1="40" y1="170" x2="780" y2="170" stroke="#1a1a1a" stroke-width="2"/>

  <!-- Event group pattern — repeat for each milestone -->
  <!-- ABOVE baseline (tick goes up to ~y=100, labels at y=92 and y=78): -->
  <g>
    <circle cx="[X]" cy="170" r="6" fill="#b8431a" stroke="#b8431a" stroke-width="1.5"/>
    <line x1="[X]" y1="170" x2="[X]" y2="100" stroke="#8a8a8a" stroke-width="1"/>
    <text x="[X]" y="92" font-family="Inter, Helvetica Neue, Arial, sans-serif"
          font-size="11" font-weight="700" fill="#1a1a1a" text-anchor="middle">[EVENT_LABEL]</text>
    <text x="[X]" y="78" font-family="Inter, Helvetica Neue, Arial, sans-serif"
          font-size="10" fill="#4a4a4a" text-anchor="middle">[DATE]</text>
    <!-- Optional third line of annotation at y=64: -->
    <!-- <text x="[X]" y="64" font-size="9" fill="#4a4a4a" text-anchor="middle">[DETAIL]</text> -->
  </g>

  <!-- BELOW baseline (tick goes down to ~y=218, labels at y=234 and y=248): -->
  <g>
    <circle cx="[X]" cy="170" r="6" fill="#b8431a" stroke="#b8431a" stroke-width="1.5"/>
    <line x1="[X]" y1="170" x2="[X]" y2="218" stroke="#8a8a8a" stroke-width="1"/>
    <text x="[X]" y="234" font-family="Inter, Helvetica Neue, Arial, sans-serif"
          font-size="10" fill="#1a1a1a" text-anchor="middle" font-weight="700">[EVENT_LABEL]</text>
    <text x="[X]" y="248" font-family="Inter, Helvetica Neue, Arial, sans-serif"
          font-size="10" fill="#4a4a4a" text-anchor="middle">[DATE]</text>
    <!-- Optional: <text x="[X]" y="262" font-size="9" fill="#4a4a4a" text-anchor="middle">[DETAIL]</text> -->
  </g>

  <!-- Muted year markers along the baseline (y=190 above, y=158 below, depending on which side is clear) -->
  <g font-family="Inter, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#8a8a8a">
    <text x="[X]" y="190" text-anchor="middle">[YEAR]</text>
    <!-- ... -->
  </g>

</svg>
```

---

## Skeleton 4: Two-panel comparison table (SVG)

Source: article-2.html, Chart 1. viewBox 820 × 320. Two side-by-side panels, each 370px wide with a 40px gap between them. Left panel starts at x=20, right panel at x=430.

Use this when you need to show two lists side by side (e.g., compliant vs. non-compliant states, locked vs. opt-out sections).

```html
<svg viewBox="0 0 820 320" xmlns="http://www.w3.org/2000/svg" role="img"
     aria-label="[REPLACE: full verbal description]">

  <!-- LEFT PANEL -->
  <rect x="20" y="20" width="370" height="[TOTAL_HEIGHT]" fill="#f5f3ee" stroke="#cfc8b8" stroke-width="1"/>
  <!-- Header bar (blue for positive/compliant) -->
  <rect x="20" y="20" width="370" height="36" fill="#2c5d8f"/>
  <text x="205" y="43" font-family="Inter, Helvetica Neue, Arial, sans-serif"
        font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle">[LEFT_HEADER]</text>
  <text x="205" y="57" font-family="Inter, Helvetica Neue, Arial, sans-serif"
        font-size="10" fill="#ffffff" text-anchor="middle" opacity="0.85">[LEFT_SUBHEADER]</text>

  <!-- LEFT PANEL ROWS — alternate fill #eae7df and #f5f3ee, each row 40px tall starting at y=56 -->
  <g font-family="Inter, Helvetica Neue, Arial, sans-serif" font-size="12" fill="#1a1a1a">
    <rect x="20" y="56"  width="370" height="40" fill="#eae7df"/>
    <text x="46" y="81" font-weight="700">[ROW_1_LABEL]</text>
    <text x="[VALUE_X]" y="81" fill="#2c5d8f" font-weight="700">[ROW_1_VALUE]</text>

    <rect x="20" y="96"  width="370" height="40" fill="#f5f3ee"/>
    <text x="46" y="121" font-weight="700">[ROW_2_LABEL]</text>
    <text x="[VALUE_X]" y="121" fill="#2c5d8f" font-weight="700">[ROW_2_VALUE]</text>
    <!-- ... continue rows at y=136, 176, 216, 256 ... -->
  </g>

  <!-- RIGHT PANEL -->
  <rect x="430" y="20" width="370" height="[TOTAL_HEIGHT]" fill="#f5f3ee" stroke="#cfc8b8" stroke-width="1"/>
  <!-- Header bar (red-orange for negative/violating) -->
  <rect x="430" y="20" width="370" height="36" fill="#b8431a"/>
  <text x="615" y="43" font-family="Inter, Helvetica Neue, Arial, sans-serif"
        font-size="12" font-weight="700" fill="#ffffff" text-anchor="middle">[RIGHT_HEADER]</text>
  <text x="615" y="57" font-family="Inter, Helvetica Neue, Arial, sans-serif"
        font-size="10" fill="#ffffff" text-anchor="middle" opacity="0.85">[RIGHT_SUBHEADER]</text>

  <!-- RIGHT PANEL ROWS -->
  <g font-family="Inter, Helvetica Neue, Arial, sans-serif" font-size="12" fill="#1a1a1a">
    <rect x="430" y="56"  width="370" height="40" fill="#eae7df"/>
    <text x="456" y="81" font-weight="700">[ROW_1_LABEL]</text>
    <text x="[VALUE_X]" y="81" fill="#b8431a" font-weight="700">[ROW_1_VALUE]</text>

    <rect x="430" y="96"  width="370" height="40" fill="#f5f3ee"/>
    <text x="456" y="121" font-weight="700">[ROW_2_LABEL]</text>
    <text x="[VALUE_X]" y="121" fill="#b8431a" font-weight="700">[ROW_2_VALUE]</text>
    <!-- ... continue rows ... -->
  </g>

</svg>
```

---

## HTML matrix table skeleton

Source: article.html, Chart 1 (Appendix). Use for reference grids, section-by-section breakdowns, and any data where rows need individual reading.

```html
<table class="matrix">
  <thead>
    <tr>
      <th>[COL_1_HEAD]</th>
      <th>[COL_2_HEAD]</th>
      <th style="width:110px;">[STATUS_HEAD]</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="section">[IDENTIFIER]</td>
      <td>[Description of this row]</td>
      <td><span class="pill locked">Locked</span></td>
    </tr>
    <tr>
      <td class="section">[IDENTIFIER]</td>
      <td>[Description of this row]</td>
      <td><span class="pill optout">Opt-out</span></td>
    </tr>
    <!-- ... repeat ... -->
  </tbody>
</table>
```

Status pill classes:
- `pill locked` — renders in blue, for mandatory/structural provisions
- `pill optout` — renders muted, for provisions plan sponsors can waive

Notes:
- Use `class="section"` on the first `<td>` when that column contains a short identifier (section number, state abbreviation, etc.)
- No inline styles needed; all styling comes from `assets/styles.css`

/// <reference types="node" />
import * as fs from 'fs';
import * as path from 'path';
import { DEFAULT_CURRENCY_CODE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CumulativeSpendChartComponent } from './cumulative-spend-chart.component';
import { IDailyCumulativeAmount } from '../../home.utils';

describe('CumulativeSpendChartComponent', () => {
  let component: CumulativeSpendChartComponent;
  let fixture: ComponentFixture<CumulativeSpendChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CumulativeSpendChartComponent],
      providers: [{ provide: DEFAULT_CURRENCY_CODE, useValue: 'GBP' }],
    }).compileComponents();

    fixture = TestBed.createComponent(CumulativeSpendChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  describe('with no data', () => {
    it('should show the empty state', () => {
      fixture.detectChanges();

      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('No transactions yet.');
    });

    it('should not render the legend or chart', () => {
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      expect(element.querySelector('.legend')).toBeNull();
      expect(element.querySelector('.chart-svg')).toBeNull();
    });
  });

  describe('with a multi-day series for each month', () => {
    const currentMonth: IDailyCumulativeAmount[] = [
      { day: 1, date: '2024-06-01', cumulativeAmount: 10 },
      { day: 2, date: '2024-06-02', cumulativeAmount: 25 },
    ];
    const previousMonth: IDailyCumulativeAmount[] = [
      { day: 1, date: '2024-05-01', cumulativeAmount: 5 },
      { day: 2, date: '2024-05-02', cumulativeAmount: 15 },
      { day: 3, date: '2024-05-03', cumulativeAmount: 40 },
    ];

    beforeEach(() => {
      component.currentMonth = currentMonth;
      component.previousMonth = previousMonth;
      fixture.detectChanges();
    });

    it('should not show the empty state', () => {
      const element = fixture.nativeElement as HTMLElement;
      expect(element.querySelector('.empty-state')).toBeNull();
    });

    it('should render the legend', () => {
      const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
      expect(text).toContain('This month');
      expect(text).toContain('Last month');
    });

    it('should render a polyline per series', () => {
      const element = fixture.nativeElement as HTMLElement;
      expect(element.querySelector('polyline.current')).not.toBeNull();
      expect(element.querySelector('polyline.previous')).not.toBeNull();
    });

    it('should plot the last day of each series at the correct running total', () => {
      const currentPoints = component['currentPoints'];
      const previousPoints = component['previousPoints'];

      expect(currentPoints[currentPoints.length - 1].cumulativeAmount).toBe(
        25
      );
      expect(previousPoints[previousPoints.length - 1].cumulativeAmount).toBe(
        40
      );
    });

    it('should plot day 1 of both series at the same x position', () => {
      const currentPoints = component['currentPoints'];
      const previousPoints = component['previousPoints'];

      expect(currentPoints[0].x).toBe(previousPoints[0].x);
    });
  });

  describe('when the current month has a single data point (the 1st of the month)', () => {
    beforeEach(() => {
      component.currentMonth = [
        { day: 1, date: '2024-06-01', cumulativeAmount: 12 },
      ];
      component.previousMonth = [
        { day: 1, date: '2024-05-01', cumulativeAmount: 5 },
        { day: 2, date: '2024-05-02', cumulativeAmount: 9 },
      ];
      fixture.detectChanges();
    });

    it('should render a dot instead of a polyline for the current month', () => {
      const element = fixture.nativeElement as HTMLElement;
      expect(element.querySelector('polyline.current')).toBeNull();
      expect(element.querySelector('circle.dot.current')).not.toBeNull();
    });

    it('should render the dot at finite, in-bounds coordinates with a non-zero visible radius', () => {
      const element = fixture.nativeElement as HTMLElement;
      const dot = element.querySelector('circle.dot.current') as SVGCircleElement;

      expect(dot).not.toBeNull();

      const cx = Number(dot.getAttribute('cx'));
      const cy = Number(dot.getAttribute('cy'));
      const r = Number(dot.getAttribute('r'));

      expect(Number.isFinite(cx)).toBe(true);
      expect(Number.isFinite(cy)).toBe(true);
      // Within the 320x160 viewBox -- not off in some degenerate corner outside the visible area.
      expect(cx).toBeGreaterThanOrEqual(0);
      expect(cx).toBeLessThanOrEqual(320);
      expect(cy).toBeGreaterThanOrEqual(0);
      expect(cy).toBeLessThanOrEqual(160);
      expect(r).toBeGreaterThan(0);
    });
  });

  describe('SVG coordinate edge cases', () => {
    it('should not produce NaN or Infinity coordinates for an all-zero (flat) series', () => {
      const flatSeries: IDailyCumulativeAmount[] = [
        { day: 1, date: '2024-06-01', cumulativeAmount: 0 },
        { day: 2, date: '2024-06-02', cumulativeAmount: 0 },
        { day: 3, date: '2024-06-03', cumulativeAmount: 0 },
      ];

      component.currentMonth = flatSeries;
      component.previousMonth = flatSeries;
      fixture.detectChanges();

      const element = fixture.nativeElement as HTMLElement;
      const currentPoints = element
        .querySelector('polyline.current')
        ?.getAttribute('points');
      const previousPoints = element
        .querySelector('polyline.previous')
        ?.getAttribute('points');

      expect(currentPoints).toBeTruthy();
      expect(previousPoints).toBeTruthy();
      expect(currentPoints).not.toMatch(/NaN|Infinity/);
      expect(previousPoints).not.toMatch(/NaN|Infinity/);

      // A flat all-zero series should plot as a flat line sitting on the baseline.
      const baselineY = component['baselineY'];
      const yCoordinates = (currentPoints as string)
        .split(' ')
        .map((pair) => Number(pair.split(',')[1]));
      expect(yCoordinates.every((y) => y === baselineY)).toBe(true);
    });

    it('should not produce NaN coordinates when the host element has zero width/height', () => {
      const series: IDailyCumulativeAmount[] = [
        { day: 1, date: '2024-06-01', cumulativeAmount: 10 },
        { day: 2, date: '2024-06-02', cumulativeAmount: 25 },
      ];

      const host = fixture.nativeElement as HTMLElement;
      host.style.width = '0px';
      host.style.height = '0px';
      host.style.overflow = 'hidden';

      component.currentMonth = series;
      component.previousMonth = series;
      fixture.detectChanges();

      const points = host
        .querySelector('polyline.current')
        ?.getAttribute('points');

      expect(points).toBeTruthy();
      expect(points).not.toMatch(/NaN|Infinity/);
      // The chart plots against a fixed internal viewBox rather than the host's measured size,
      // so a zero-size host doesn't change the plotted coordinates at all.
      expect(points).toBe(
        component['toPolylinePoints'](component['currentPoints'])
      );
    });

    it('keeps y coordinates within the viewBox when a refund makes the running total deeply negative relative to the month', () => {
      // Day 1 sets the positive extreme (20), then day 2's refund drags the running total far
      // below zero (-100). The y-scale now spans the full [min, max] range across both series
      // rather than assuming 0 is always the visual floor, so both points stay within the visible
      // 0..160 viewBox instead of the negative excursion being clipped by the SVG's default
      // overflow:hidden.
      component.currentMonth = [
        { day: 1, date: '2024-06-01', cumulativeAmount: 20 },
        { day: 2, date: '2024-06-02', cumulativeAmount: -100 },
      ];
      component.previousMonth = [];
      fixture.detectChanges();

      const points = component['currentPoints'];
      const [day1Y, day2Y] = points.map((point) => point.y);

      expect(Number.isFinite(day1Y)).toBe(true);
      expect(Number.isFinite(day2Y)).toBe(true);
      expect(day1Y).toBeGreaterThanOrEqual(0);
      expect(day1Y).toBeLessThanOrEqual(160);
      expect(day2Y).toBeGreaterThanOrEqual(0);
      expect(day2Y).toBeLessThanOrEqual(160);

      // Day 2 is the lowest value in range, so it sits on the baseline; day 1 is the highest
      // value, so it sits at the top padding -- confirming the scale now uses the full range.
      expect(day2Y).toBe(component['baselineY']);
      expect(day1Y).toBeLessThan(day2Y);
    });
  });

  describe('legend', () => {
    const currentMonth: IDailyCumulativeAmount[] = [
      { day: 1, date: '2024-06-01', cumulativeAmount: 10 },
      { day: 2, date: '2024-06-02', cumulativeAmount: 25 },
    ];
    const previousMonth: IDailyCumulativeAmount[] = [
      { day: 1, date: '2024-05-01', cumulativeAmount: 5 },
      { day: 2, date: '2024-05-02', cumulativeAmount: 15 },
    ];

    beforeEach(() => {
      component.currentMonth = currentMonth;
      component.previousMonth = previousMonth;
      fixture.detectChanges();
    });

    it('should render exactly one legend entry per series, with the correct label text', () => {
      const items = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll('.legend-item')
      );

      expect(items).toHaveLength(2);
      expect(items[0].textContent?.trim()).toBe('This month');
      expect(items[1].textContent?.trim()).toBe('Last month');
    });

    it('should give the current-month legend swatch the "current" class and the previous-month swatch the "previous" class', () => {
      const items = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll('.legend-item')
      );

      expect(items[0].querySelector('.swatch.current')).not.toBeNull();
      expect(items[1].querySelector('.swatch.previous')).not.toBeNull();
    });

    /** The legend swatches are plain `<span>`s styled via `.swatch.current`/`.swatch.previous` in
     * the component's SCSS, entirely independent of the `.line.current`/`.line.previous` (and
     * `.dot.current`/`.dot.previous`) rules that colour the actual plotted line/dot. Jest's DOM
     * environment here doesn't apply the component's real stylesheet (`getComputedStyle` can't
     * resolve it), so the only reliable way to confirm the legend swatch colour actually matches
     * the line/dot colour is to read the SCSS source and compare which CSS custom property each
     * selector resolves to. */
    describe('cross-checked against the SCSS source', () => {
      const scssPath = path.join(__dirname, 'cumulative-spend-chart.component.scss');
      const scssContent = fs.readFileSync(scssPath, 'utf-8');

      function declarationFor(selector: string, property: string): string | undefined {
        const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const ruleMatch = scssContent.match(
          new RegExp(`${escaped}\\s*\\{([^}]*)\\}`)
        );
        if (!ruleMatch) {
          return undefined;
        }

        const propMatch = ruleMatch[1].match(
          new RegExp(`${property}\\s*:\\s*([^;]+);`)
        );
        return propMatch?.[1].trim();
      }

      it('should define both a "current" and "previous" swatch/line colour pairing', () => {
        expect(declarationFor('.swatch.current', 'background')).toBeDefined();
        expect(declarationFor('.swatch.previous', 'background')).toBeDefined();
        expect(declarationFor('.line.current', 'stroke')).toBeDefined();
        expect(declarationFor('.line.previous', 'stroke')).toBeDefined();
      });

      it('should colour the "current" swatch with the same custom property as the current line/dot', () => {
        const swatchColor = declarationFor('.swatch.current', 'background');

        expect(swatchColor).toBe(declarationFor('.line.current', 'stroke'));
        expect(swatchColor).toBe(declarationFor('.dot.current', 'fill'));
      });

      it('should colour the "previous" swatch with the same custom property as the previous line/dot', () => {
        const swatchColor = declarationFor('.swatch.previous', 'background');

        expect(swatchColor).toBe(declarationFor('.line.previous', 'stroke'));
        expect(swatchColor).toBe(declarationFor('.dot.previous', 'fill'));
      });

      it('should use different colours for the current and previous series', () => {
        expect(declarationFor('.swatch.current', 'background')).not.toBe(
          declarationFor('.swatch.previous', 'background')
        );
      });
    });
  });
});

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

  describe('hover and keyboard interaction', () => {
    // Current month only goes to day 3 ("today"); previous month is a full month so it extends
    // further, to day 5.
    const currentMonth: IDailyCumulativeAmount[] = [
      { day: 1, date: '2024-06-01', cumulativeAmount: 10 },
      { day: 2, date: '2024-06-02', cumulativeAmount: 25 },
      { day: 3, date: '2024-06-03', cumulativeAmount: 30 },
    ];
    const previousMonth: IDailyCumulativeAmount[] = [
      { day: 1, date: '2024-05-01', cumulativeAmount: 5 },
      { day: 2, date: '2024-05-02', cumulativeAmount: 15 },
      { day: 3, date: '2024-05-03', cumulativeAmount: 20 },
      { day: 4, date: '2024-05-04', cumulativeAmount: 22 },
      { day: 5, date: '2024-05-05', cumulativeAmount: 40 },
    ];

    let svg: SVGSVGElement;

    beforeEach(() => {
      component.currentMonth = currentMonth;
      component.previousMonth = previousMonth;
      fixture.detectChanges();

      svg = (fixture.nativeElement as HTMLElement).querySelector(
        '.chart-svg'
      ) as SVGSVGElement;
    });

    it('should not show a crosshair or tooltip by default', () => {
      const element = fixture.nativeElement as HTMLElement;
      expect(element.querySelector('.crosshair')).toBeNull();
      expect(element.querySelector('.tooltip')).toBeNull();
    });

    it('should be keyboard-focusable', () => {
      expect(svg.getAttribute('tabindex')).toBe('0');
    });

    it('should expose an interactive role and an accessible description of how to use arrow keys, not the static "img" role', () => {
      expect(svg.getAttribute('role')).not.toBe('img');

      const describedbyId = svg.getAttribute('aria-describedby');
      expect(describedbyId).toBeTruthy();

      const element = fixture.nativeElement as HTMLElement;
      const hint = element.querySelector(`#${describedbyId}`);
      expect(hint).not.toBeNull();
      expect(hint?.textContent?.toLowerCase()).toContain('arrow keys');
    });

    describe('hovering', () => {
      it('should select the nearest day and show a crosshair + tooltip', () => {
        jest
          .spyOn(svg, 'getBoundingClientRect')
          .mockReturnValue({ left: 0, width: 320 } as DOMRect);

        // The exact x position of day 3 out of 5 plotted days (maxDay is 5, since the previous
        // month's series is longer): 12px padding + 0.5 * (320 - 2*12)px range = 160.
        svg.dispatchEvent(
          new MouseEvent('mousemove', { clientX: 160 })
        );
        fixture.detectChanges();

        expect(component['selectedDay']).toBe(3);

        const element = fixture.nativeElement as HTMLElement;
        expect(element.querySelector('.crosshair')).not.toBeNull();
        expect(element.querySelector('.tooltip')?.textContent).toContain(
          'Day 3'
        );
      });

      it('should allow hovering past the current month onto previous-month-only days', () => {
        jest
          .spyOn(svg, 'getBoundingClientRect')
          .mockReturnValue({ left: 0, width: 320 } as DOMRect);

        // Far right, past where the current-month series (3 days) ends but within the 5-day
        // previous-month series.
        svg.dispatchEvent(new MouseEvent('mousemove', { clientX: 319 }));
        fixture.detectChanges();

        expect(component['selectedDay']).toBe(5);
        expect(component['selectedCurrentPoint']).toBeNull();
        expect(component['selectedPreviousPoint']).not.toBeNull();

        const tooltipText = (fixture.nativeElement as HTMLElement).querySelector(
          '.tooltip'
        )?.textContent;
        expect(tooltipText).toContain('No data yet');
      });

      it('should clear the selection on mouse leave when the chart is not focused', () => {
        jest
          .spyOn(svg, 'getBoundingClientRect')
          .mockReturnValue({ left: 0, width: 320 } as DOMRect);

        svg.dispatchEvent(new MouseEvent('mousemove', { clientX: 100 }));
        fixture.detectChanges();
        expect(component['selectedDay']).not.toBeNull();

        svg.dispatchEvent(new MouseEvent('mouseleave'));
        fixture.detectChanges();
        expect(component['selectedDay']).toBeNull();
      });
    });

    describe('keyboard navigation', () => {
      it('should select the last current-month day when the chart gains focus', () => {
        svg.dispatchEvent(new FocusEvent('focus'));
        fixture.detectChanges();

        expect(component['selectedDay']).toBe(3);
      });

      it('should move the selection left/right one day at a time', () => {
        svg.dispatchEvent(new FocusEvent('focus'));
        fixture.detectChanges();
        expect(component['selectedDay']).toBe(3);

        svg.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowLeft' })
        );
        fixture.detectChanges();
        expect(component['selectedDay']).toBe(2);

        svg.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowRight' })
        );
        fixture.detectChanges();
        expect(component['selectedDay']).toBe(3);
      });

      it('should not move left past day 1', () => {
        svg.dispatchEvent(new FocusEvent('focus'));
        component['selectedDay'] = 1;
        fixture.detectChanges();

        svg.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowLeft' })
        );
        fixture.detectChanges();

        expect(component['selectedDay']).toBe(1);
      });

      it("should not move right past the current month's last plotted day, even though the previous month's series extends further", () => {
        svg.dispatchEvent(new FocusEvent('focus'));
        fixture.detectChanges();
        expect(component['selectedDay']).toBe(3);

        svg.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'ArrowRight' })
        );
        fixture.detectChanges();

        expect(component['selectedDay']).toBe(3);
      });

      it('should clear the selection on blur', () => {
        svg.dispatchEvent(new FocusEvent('focus'));
        fixture.detectChanges();
        expect(component['selectedDay']).not.toBeNull();

        svg.dispatchEvent(new FocusEvent('blur'));
        fixture.detectChanges();

        expect(component['selectedDay']).toBeNull();
      });
    });

    describe('accessibility announcement', () => {
      it('should keep the aria-live region empty when nothing is selected', () => {
        const element = fixture.nativeElement as HTMLElement;
        const liveRegion = element.querySelector('[aria-live="polite"]');

        expect(liveRegion).not.toBeNull();
        expect(liveRegion?.textContent?.trim()).toBe('');
      });

      it('should announce both series for the selected day', () => {
        svg.dispatchEvent(new FocusEvent('focus'));
        fixture.detectChanges();

        const element = fixture.nativeElement as HTMLElement;
        const liveRegion = element.querySelector('[aria-live="polite"]');

        expect(liveRegion?.textContent).toContain('Day 3');
        expect(liveRegion?.textContent).toContain('This month');
        expect(liveRegion?.textContent).toContain('Last month');
      });

      it('should update the announcement text when the selected day changes, rather than staying stuck on the first selection', () => {
        svg.dispatchEvent(new FocusEvent('focus'));
        fixture.detectChanges();

        const element = fixture.nativeElement as HTMLElement;
        const liveRegion = element.querySelector('[aria-live="polite"]');
        const firstAnnouncement = liveRegion?.textContent;
        expect(firstAnnouncement).toContain('Day 3');

        svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
        fixture.detectChanges();

        const secondAnnouncement = liveRegion?.textContent;
        expect(secondAnnouncement).toContain('Day 2');
        expect(secondAnnouncement).not.toBe(firstAnnouncement);
        expect(secondAnnouncement).not.toContain('Day 3');
      });

      it('should announce the "No data yet" fallback (not blank/undefined) for a hovered day beyond the current month, while still announcing the real previous-month amount', () => {
        jest
          .spyOn(svg, 'getBoundingClientRect')
          .mockReturnValue({ left: 0, width: 320 } as DOMRect);

        // Day 5: past current month's 3 plotted days, within previous month's 5.
        svg.dispatchEvent(new MouseEvent('mousemove', { clientX: 319 }));
        fixture.detectChanges();

        const element = fixture.nativeElement as HTMLElement;
        const liveRegion = element.querySelector('[aria-live="polite"]');

        expect(liveRegion?.textContent).toContain('Day 5');
        expect(liveRegion?.textContent).toContain('No data yet');
        expect(liveRegion?.textContent).not.toContain('undefined');
        // Previous month's real (non-zero) total for day 5 should still be announced.
        expect(liveRegion?.textContent).toMatch(/£?40(\.00)?/);
      });
    });

    describe('mouse-position-to-day boundary mapping', () => {
      beforeEach(() => {
        jest
          .spyOn(svg, 'getBoundingClientRect')
          .mockReturnValue({ left: 0, width: 320 } as DOMRect);
      });

      it('should map clientX exactly at the left edge (0) to day 1, not day 0 or NaN', () => {
        svg.dispatchEvent(new MouseEvent('mousemove', { clientX: 0 }));
        fixture.detectChanges();

        expect(component['selectedDay']).toBe(1);
      });

      it('should clamp to day 1 (not go negative or NaN) when the event fires slightly outside the SVG bounding box', () => {
        svg.dispatchEvent(new MouseEvent('mousemove', { clientX: -25 }));
        fixture.detectChanges();

        expect(component['selectedDay']).toBe(1);
        expect(Number.isNaN(component['selectedDay'])).toBe(false);
      });

      it('should map clientX at the far right edge to the last plotted day across both series (maxDay), which here is previous month\'s day 5, not current month\'s day 3', () => {
        svg.dispatchEvent(new MouseEvent('mousemove', { clientX: 320 }));
        fixture.detectChanges();

        expect(component['selectedDay']).toBe(5);
      });

      it('should clamp the tooltip position so it does not naively center on day 1 (which would push it past the wrapper\'s left edge)', () => {
        // `[style.left]` is bound to a CSS `clamp(...)` expression, so the tooltip's left edge
        // can't be pushed past the wrapper's edge by `translateX(-50%)`. Asserted against the
        // component's `tooltipLeft` getter directly rather than the rendered `style` attribute,
        // since jsdom's CSSOM (unlike real browsers) doesn't recognise `clamp()` as a valid
        // value for `left` and silently drops it, which would make this a false negative.
        svg.dispatchEvent(new MouseEvent('mousemove', { clientX: 0 }));
        fixture.detectChanges();
        expect(component['selectedDay']).toBe(1);

        expect(component['tooltipLeft']).toMatch(/^clamp\(/);
        expect(component['tooltipLeft']).toContain('0%');
      });

      it('should clamp the tooltip position at the far right plotted day too', () => {
        svg.dispatchEvent(new MouseEvent('mousemove', { clientX: 320 }));
        fixture.detectChanges();
        expect(component['selectedDay']).toBe(5);

        expect(component['tooltipLeft']).toMatch(/^clamp\(/);
        expect(component['tooltipLeft']).toContain('100%');
      });

      it('should round a position exactly halfway between two days up to the later day', () => {
        // maxDay is 5 (previous month's series), so day-to-day spacing in viewBox units is
        // (320 - 2*12) / (5 - 1) = 74px. Day 1 is at x=12, day 2 is at x=86. The exact midpoint
        // (x=49) should round to one side deterministically rather than being flaky.
        svg.dispatchEvent(new MouseEvent('mousemove', { clientX: 49 }));
        fixture.detectChanges();

        expect(component['selectedDay']).toBe(2);
      });
    });

    describe('keyboard navigation boundary robustness', () => {
      it('should not drift below day 1 when ArrowLeft is pressed repeatedly at the boundary', () => {
        svg.dispatchEvent(new FocusEvent('focus'));
        component['selectedDay'] = 1;
        fixture.detectChanges();

        for (let i = 0; i < 5; i++) {
          svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
        }
        fixture.detectChanges();

        expect(component['selectedDay']).toBe(1);
      });

      it("should not drift past maxKeyboardDay when ArrowRight is pressed repeatedly at the boundary", () => {
        svg.dispatchEvent(new FocusEvent('focus'));
        fixture.detectChanges();
        expect(component['selectedDay']).toBe(3);

        for (let i = 0; i < 5; i++) {
          svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
        }
        fixture.detectChanges();

        expect(component['selectedDay']).toBe(3);
      });

      it('should not throw when ArrowRight/ArrowLeft are pressed repeatedly past their boundaries', () => {
        svg.dispatchEvent(new FocusEvent('focus'));
        fixture.detectChanges();

        expect(() => {
          for (let i = 0; i < 10; i++) {
            svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
          }
          for (let i = 0; i < 10; i++) {
            svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
          }
        }).not.toThrow();
      });
    });

    describe('focus/hover/blur interaction edge cases', () => {
      it('should let hover move the selection to a different day than the one focus defaulted to (tooltip follows hover, not stuck on the focus default)', () => {
        jest
          .spyOn(svg, 'getBoundingClientRect')
          .mockReturnValue({ left: 0, width: 320 } as DOMRect);

        svg.dispatchEvent(new FocusEvent('focus'));
        fixture.detectChanges();
        expect(component['selectedDay']).toBe(3);

        // Hover day 1 (x=12) while the chart still has focus.
        svg.dispatchEvent(new MouseEvent('mousemove', { clientX: 12 }));
        fixture.detectChanges();

        expect(component['selectedDay']).toBe(1);
        const tooltipText = (fixture.nativeElement as HTMLElement).querySelector(
          '.tooltip'
        )?.textContent;
        expect(tooltipText).toContain('Day 1');
      });

      it('should let arrow keys navigate from a hover-set day even when the chart was never explicitly focused first', () => {
        jest
          .spyOn(svg, 'getBoundingClientRect')
          .mockReturnValue({ left: 0, width: 320 } as DOMRect);

        // Hover day 2 without ever dispatching a focus event.
        svg.dispatchEvent(new MouseEvent('mousemove', { clientX: 86 }));
        fixture.detectChanges();
        expect(component['selectedDay']).toBe(2);

        svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
        fixture.detectChanges();

        // Navigates from the hover-set day (2 -> 3), not reset to some other default first.
        expect(component['selectedDay']).toBe(3);
      });

      it('should clamp into range in a single ArrowLeft press from a hover-set day beyond maxKeyboardDay, just like ArrowRight does', () => {
        // Hover past the current month onto a previous-month-only day (day 5), then press
        // ArrowLeft once. The keyboard handler clamps its baseline into `[1, maxKeyboardDay]`
        // (5 -> 3) before applying the delta, so a single press lands on day 2 -- already within
        // the current-month range -- rather than merely decrementing from 5 to 4 and staying out
        // of range for another keypress.
        jest
          .spyOn(svg, 'getBoundingClientRect')
          .mockReturnValue({ left: 0, width: 320 } as DOMRect);

        svg.dispatchEvent(new MouseEvent('mousemove', { clientX: 319 }));
        fixture.detectChanges();
        expect(component['selectedDay']).toBe(5);

        svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
        fixture.detectChanges();

        expect(component['selectedDay']).toBe(2);
        expect(component['selectedCurrentPoint']).not.toBeNull();
      });

      it('should clamp into range in a single ArrowRight press from a hover-set day beyond maxKeyboardDay', () => {
        // Same scenario as the ArrowLeft case above, but pressing ArrowRight -- it must not move
        // the cursor further from the valid range (or backward from 5) than a single clamp step.
        jest
          .spyOn(svg, 'getBoundingClientRect')
          .mockReturnValue({ left: 0, width: 320 } as DOMRect);

        svg.dispatchEvent(new MouseEvent('mousemove', { clientX: 319 }));
        fixture.detectChanges();
        expect(component['selectedDay']).toBe(5);

        svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
        fixture.detectChanges();

        expect(component['selectedDay']).toBe(3);
        expect(component['selectedCurrentPoint']).not.toBeNull();
      });

      it('should clamp a hover-set out-of-range day back into the keyboard-valid range when focus arrives', () => {
        // Hover a previous-month-only day (5) before the chart is ever focused, then focus it.
        // Focus should reconcile `selectedDay` back into `[1, maxKeyboardDay]` immediately, not
        // leave it out of range until the first arrow keypress.
        jest
          .spyOn(svg, 'getBoundingClientRect')
          .mockReturnValue({ left: 0, width: 320 } as DOMRect);

        svg.dispatchEvent(new MouseEvent('mousemove', { clientX: 319 }));
        fixture.detectChanges();
        expect(component['selectedDay']).toBe(5);

        svg.dispatchEvent(new FocusEvent('focus'));
        fixture.detectChanges();

        expect(component['selectedDay']).toBe(3);
        expect(component['selectedCurrentPoint']).not.toBeNull();
      });

      it('should keep the crosshair and tooltip visible on mouseleave when the chart still has keyboard focus', () => {
        svg.dispatchEvent(new FocusEvent('focus'));
        fixture.detectChanges();
        expect(component['selectedDay']).toBe(3);

        svg.dispatchEvent(new MouseEvent('mouseleave'));
        fixture.detectChanges();

        expect(component['selectedDay']).toBe(3);
        const element = fixture.nativeElement as HTMLElement;
        expect(element.querySelector('.crosshair')).not.toBeNull();
        expect(element.querySelector('.tooltip')).not.toBeNull();
      });

      it('should clear the crosshair/tooltip on blur even when a day was selected via keyboard', () => {
        svg.dispatchEvent(new FocusEvent('focus'));
        svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
        fixture.detectChanges();
        expect(component['selectedDay']).toBe(2);

        svg.dispatchEvent(new FocusEvent('blur'));
        fixture.detectChanges();

        expect(component['selectedDay']).toBeNull();
        const element = fixture.nativeElement as HTMLElement;
        expect(element.querySelector('.crosshair')).toBeNull();
        expect(element.querySelector('.tooltip')).toBeNull();
      });
    });

    describe('"No data yet" fallback correctness', () => {
      it('should show the fallback for the current-month display and the real (possibly zero) previous-month value for the same day, not undefined/$0/crash', () => {
        jest
          .spyOn(svg, 'getBoundingClientRect')
          .mockReturnValue({ left: 0, width: 320 } as DOMRect);

        svg.dispatchEvent(new MouseEvent('mousemove', { clientX: 319 }));
        fixture.detectChanges();

        expect(component['selectedDay']).toBe(5);
        expect(component['selectedCurrentPoint']).toBeNull();
        expect(component['amountLabel'](component['selectedCurrentPoint'])).toBe(
          'No data yet'
        );

        expect(component['selectedPreviousPoint']).not.toBeNull();
        expect(component['selectedPreviousPoint']?.cumulativeAmount).toBe(40);
        expect(component['amountLabel'](component['selectedPreviousPoint'])).not.toBe(
          'No data yet'
        );

        const tooltipText = (fixture.nativeElement as HTMLElement).querySelector(
          '.tooltip'
        )?.textContent;
        expect(tooltipText).not.toContain('undefined');
        expect(tooltipText).not.toMatch(/This month.*:\s*(\$0|£0)/);
      });
    });
  });

  describe('when currentMonth is empty but previousMonth has data (maxKeyboardDay === 0)', () => {
    let svg: SVGSVGElement;

    beforeEach(() => {
      component.currentMonth = [];
      component.previousMonth = [
        { day: 1, date: '2024-05-01', cumulativeAmount: 5 },
        { day: 2, date: '2024-05-02', cumulativeAmount: 15 },
      ];
      fixture.detectChanges();

      svg = (fixture.nativeElement as HTMLElement).querySelector(
        '.chart-svg'
      ) as SVGSVGElement;
    });

    it('should render the chart (not the empty state) since previousMonth has data', () => {
      const element = fixture.nativeElement as HTMLElement;
      expect(element.querySelector('.empty-state')).toBeNull();
      expect(element.querySelector('.chart-svg')).not.toBeNull();
    });

    it('should not select a default day on focus, since there is no current-month day to default to', () => {
      svg.dispatchEvent(new FocusEvent('focus'));
      fixture.detectChanges();

      expect(component['selectedDay']).toBeNull();
    });

    it('should not throw and should leave selection unset when arrow keys are pressed', () => {
      svg.dispatchEvent(new FocusEvent('focus'));

      expect(() => {
        svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
        svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
      }).not.toThrow();
      fixture.detectChanges();

      expect(component['selectedDay']).toBeNull();
    });

    it('should still allow mouse hover to select a previous-month day', () => {
      jest
        .spyOn(svg, 'getBoundingClientRect')
        .mockReturnValue({ left: 0, width: 320 } as DOMRect);

      svg.dispatchEvent(new MouseEvent('mousemove', { clientX: 320 }));
      fixture.detectChanges();

      expect(component['selectedDay']).toBe(2);
      expect(component['selectedCurrentPoint']).toBeNull();
      expect(component['selectedPreviousPoint']).not.toBeNull();
    });
  });

  describe('interaction with a single-point current-month series (day 1 only)', () => {
    let svg: SVGSVGElement;

    beforeEach(() => {
      component.currentMonth = [
        { day: 1, date: '2024-06-01', cumulativeAmount: 12 },
      ];
      component.previousMonth = [];
      fixture.detectChanges();

      svg = (fixture.nativeElement as HTMLElement).querySelector(
        '.chart-svg'
      ) as SVGSVGElement;
    });

    it('should not crash and should select day 1 on focus (the only plotted/keyboard-navigable day)', () => {
      expect(() => svg.dispatchEvent(new FocusEvent('focus'))).not.toThrow();
      fixture.detectChanges();

      expect(component['selectedDay']).toBe(1);
    });

    it('should not crash on arrow key presses in either direction and should stay pinned to day 1', () => {
      svg.dispatchEvent(new FocusEvent('focus'));
      fixture.detectChanges();

      expect(() => {
        svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
        svg.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
      }).not.toThrow();
      fixture.detectChanges();

      expect(component['selectedDay']).toBe(1);
    });

    it('should not produce NaN and should select day 1 regardless of mouse x position (dayToX/dayFromX degenerate to a single point)', () => {
      jest
        .spyOn(svg, 'getBoundingClientRect')
        .mockReturnValue({ left: 0, width: 320 } as DOMRect);

      for (const clientX of [0, 50, 160, 300, 320]) {
        svg.dispatchEvent(new MouseEvent('mousemove', { clientX }));
        fixture.detectChanges();

        expect(component['selectedDay']).toBe(1);
        expect(Number.isNaN(component['selectedDay'])).toBe(false);
      }
    });
  });
});

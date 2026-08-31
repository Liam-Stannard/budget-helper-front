import { DEFAULT_CURRENCY_CODE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TrendLineChartComponent } from './trend-line-chart.component';
import { ITrendBucket } from '../../trend-page.utils';

describe('TrendLineChartComponent', () => {
  let component: TrendLineChartComponent;
  let fixture: ComponentFixture<TrendLineChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrendLineChartComponent],
      providers: [{ provide: DEFAULT_CURRENCY_CODE, useValue: 'GBP' }],
    }).compileComponents();

    fixture = TestBed.createComponent(TrendLineChartComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  describe('without buckets', () => {
    it('should show an empty state instead of a broken/empty svg', () => {
      component.buckets = [];
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('svg')).toBeNull();
      expect(compiled.querySelector('.empty-state')?.textContent).toContain(
        'No transactions to plot.'
      );
    });
  });

  describe('with several buckets', () => {
    const buckets: ITrendBucket[] = [
      { label: '1 Jan', amount: 10 },
      { label: '2 Jan', amount: 30 },
      { label: '3 Jan', amount: 0 },
    ];

    beforeEach(() => {
      component.buckets = buckets;
      fixture.detectChanges();
    });

    it('should render an svg with a polyline connecting every point', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      const polyline = compiled.querySelector('polyline.line');

      expect(compiled.querySelector('svg')).not.toBeNull();
      expect(polyline).not.toBeNull();
      expect(polyline?.getAttribute('points')?.split(' ').length).toBe(3);
    });

    it('should render one point per bucket', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelectorAll('circle.point').length).toBe(3);
    });

    it('should not show the empty state', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.empty-state')).toBeNull();
    });

    it('should scale the highest-amount bucket to the top of the plot area', () => {
      const points = component['plotPoints']();
      const highest = points.find((point) => point.bucket.amount === 30);

      expect(highest?.y).toBeCloseTo(12); // marginTop, i.e. the very top of the plot area
    });
  });

  describe('with a single bucket', () => {
    it('should render a single visible point rather than an invisible/degenerate line', () => {
      component.buckets = [{ label: '1 Jan', amount: 25 }];
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('polyline.line')).toBeNull();

      const point = compiled.querySelector('circle.point');
      expect(point).not.toBeNull();
      expect(point?.getAttribute('r')).toBe('5');
    });
  });

  describe('with an all-zero series', () => {
    it('should not throw or divide by zero', () => {
      component.buckets = [
        { label: '1 Jan', amount: 0 },
        { label: '2 Jan', amount: 0 },
      ];

      expect(() => fixture.detectChanges()).not.toThrow();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelectorAll('circle.point').length).toBe(2);
    });
  });

  describe('xLabelIndices', () => {
    it('should label every bucket when the count is small', () => {
      component.buckets = [
        { label: 'a', amount: 1 },
        { label: 'b', amount: 2 },
      ];

      expect(component['xLabelIndices']()).toEqual(new Set([0, 1]));
    });

    it('should only label a bounded, evenly-spaced subset for a large bucket count', () => {
      component.buckets = Array.from({ length: 90 }, (_, i) => ({
        label: `bucket-${i}`,
        amount: i,
      }));

      const indices = component['xLabelIndices']();

      expect(indices.size).toBeLessThanOrEqual(9);
      expect(indices.has(0)).toBe(true);
      expect(indices.has(89)).toBe(true);
    });

    describe('boundary counts', () => {
      it('should label every bucket at exactly 8 buckets (the MAX_X_LABELS threshold itself)', () => {
        component.buckets = Array.from({ length: 8 }, (_, i) => ({
          label: `bucket-${i}`,
          amount: i,
        }));
        fixture.detectChanges();

        const indices = component['xLabelIndices']();
        expect(indices).toEqual(new Set([0, 1, 2, 3, 4, 5, 6, 7]));

        const compiled = fixture.nativeElement as HTMLElement;
        const labels = Array.from(compiled.querySelectorAll('text.x-label')).map(
          (el) => el.textContent?.trim()
        );
        expect(labels).toHaveLength(8);
        expect(new Set(labels).size).toBe(8); // no duplicate labels
        expect(labels).toContain('bucket-0');
        expect(labels).toContain('bucket-7');
      });

      it('should thin the labels out at 9 buckets (one past the threshold), still with no duplicates and first/last present', () => {
        component.buckets = Array.from({ length: 9 }, (_, i) => ({
          label: `bucket-${i}`,
          amount: i,
        }));
        fixture.detectChanges();

        const indices = component['xLabelIndices']();
        expect(indices.has(0)).toBe(true);
        expect(indices.has(8)).toBe(true);
        expect(indices.size).toBeLessThan(9); // strictly fewer than "label every bucket"

        const compiled = fixture.nativeElement as HTMLElement;
        const labels = Array.from(compiled.querySelectorAll('text.x-label')).map(
          (el) => el.textContent?.trim()
        );
        expect(labels).toHaveLength(indices.size);
        expect(new Set(labels).size).toBe(labels.length); // no duplicate label text
        expect(labels).toContain('bucket-0');
        expect(labels).toContain('bucket-8');
      });

      it('should render a small, deduplicated, first/last-inclusive label set for a large (60-bucket, year+) series without crashing', () => {
        component.buckets = Array.from({ length: 60 }, (_, i) => ({
          label: `bucket-${i}`,
          amount: i,
        }));

        expect(() => fixture.detectChanges()).not.toThrow();

        const indices = component['xLabelIndices']();
        expect(indices.size).toBeGreaterThan(0);
        expect(indices.size).toBeLessThanOrEqual(9);
        expect(indices.has(0)).toBe(true);
        expect(indices.has(59)).toBe(true);

        const compiled = fixture.nativeElement as HTMLElement;
        const labels = Array.from(compiled.querySelectorAll('text.x-label')).map(
          (el) => el.textContent?.trim()
        );
        expect(labels).toHaveLength(indices.size);
        expect(new Set(labels).size).toBe(labels.length); // no duplicate label text
        expect(labels).toContain('bucket-0');
        expect(labels).toContain('bucket-59');
        // Every plotted point still renders, even though only a subset get a label.
        expect(compiled.querySelectorAll('circle.point').length).toBe(60);
      });

      it('should never produce an empty label array for a non-empty bucket series', () => {
        component.buckets = [{ label: 'only-one', amount: 5 }];
        fixture.detectChanges();

        expect(component['xLabelIndices']().size).toBeGreaterThan(0);
        const compiled = fixture.nativeElement as HTMLElement;
        expect(compiled.querySelectorAll('text.x-label').length).toBeGreaterThan(0);
      });
    });
  });

  describe('pointLabel', () => {
    it('should include the bucket label and formatted amount', () => {
      expect(component['pointLabel']({ label: '1 Jan', amount: 12.5 })).toBe(
        '1 Jan: £12.50'
      );
    });
  });
});

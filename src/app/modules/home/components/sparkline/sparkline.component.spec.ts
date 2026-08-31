import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SparklineComponent } from './sparkline.component';
import { ISparklineBucket } from '../../home.utils';

describe('SparklineComponent', () => {
  let component: SparklineComponent;
  let fixture: ComponentFixture<SparklineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SparklineComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SparklineComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should render a bar per bucket', () => {
    component.buckets = [
      { amount: 10, isCurrentMonth: false },
      { amount: 20, isCurrentMonth: false },
      { amount: 30, isCurrentMonth: true },
    ];
    fixture.detectChanges();

    const bars = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.bar'
    );

    expect(bars).toHaveLength(3);
  });

  it('should mark current-month buckets with the current class', () => {
    component.buckets = [
      { amount: 10, isCurrentMonth: false },
      { amount: 30, isCurrentMonth: true },
    ];
    fixture.detectChanges();

    const bars = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.bar'
    );

    expect(bars[0].classList).not.toContain('current');
    expect(bars[1].classList).toContain('current');
  });

  it('should render flat minimum-height bars without NaN when every bucket is empty', () => {
    component.buckets = [
      { amount: 0, isCurrentMonth: false },
      { amount: 0, isCurrentMonth: true },
    ];
    fixture.detectChanges();

    const bars = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.bar'
    );

    bars.forEach((bar) => {
      const height = Number(bar.getAttribute('height'));

      expect(Number.isFinite(height)).toBe(true);
      expect(height).toBeGreaterThan(0);
    });
  });

  it('should not crash and render no bars when there are no buckets', () => {
    component.buckets = [];
    fixture.detectChanges();

    const bars = (fixture.nativeElement as HTMLElement).querySelectorAll(
      '.bar'
    );

    expect(bars).toHaveLength(0);
  });

  describe('barHeight', () => {
    it('should scale bars relative to the largest bucket amount', () => {
      component.buckets = [
        { amount: 10, isCurrentMonth: false },
        { amount: 20, isCurrentMonth: false },
      ] as ISparklineBucket[];

      expect(component['barHeight'](20)).toBe(component['viewHeight']);
      expect(component['barHeight'](10)).toBeCloseTo(
        component['viewHeight'] / 2
      );
    });

    it('should scale the tallest bucket to fill the full viewport height even against one dominant outlier', () => {
      component.buckets = [
        { amount: 100000, isCurrentMonth: false },
        { amount: 1, isCurrentMonth: false },
        { amount: 0, isCurrentMonth: false },
      ] as ISparklineBucket[];

      expect(component['barHeight'](100000)).toBe(component['viewHeight']);
    });

    it('renders a near-zero (but non-zero) bucket at the same clamped floor height as a true-zero bucket when a dominant outlier is present', () => {
      // documents current behavior: MIN_BAR_HEIGHT is a floor applied *after* scaling, so once a
      // bucket's proportional height falls below the floor, that bucket becomes visually
      // indistinguishable from a bucket that had literally 0 spend -- there's no separate,
      // smaller-than-floor rendering to signal "small but present" vs "nothing at all".
      component.buckets = [
        { amount: 100000, isCurrentMonth: false },
        { amount: 1, isCurrentMonth: false }, // near-zero relative to the outlier
        { amount: 0, isCurrentMonth: false }, // true zero
      ] as ISparklineBucket[];

      const nearZeroHeight = component['barHeight'](1);
      const trueZeroHeight = component['barHeight'](0);

      expect(nearZeroHeight).toBe(trueZeroHeight);
      expect(nearZeroHeight).toBe(2); // MIN_BAR_HEIGHT
    });

    it('should not clamp a near-zero bucket to the floor once its proportional height exceeds the floor', () => {
      // sanity check on the flip side: once the ratio is large enough, scaling (not the floor)
      // determines the height, so small-but-meaningfully-sized buckets remain distinguishable
      component.buckets = [
        { amount: 100, isCurrentMonth: false },
        { amount: 10, isCurrentMonth: false },
      ] as ISparklineBucket[];

      const height = component['barHeight'](10);

      expect(height).toBeCloseTo(component['viewHeight'] * 0.1);
      expect(height).toBeGreaterThan(2); // above MIN_BAR_HEIGHT
    });
  });
});

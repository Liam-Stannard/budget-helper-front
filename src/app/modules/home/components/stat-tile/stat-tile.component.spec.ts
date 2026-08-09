import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatTileComponent } from './stat-tile.component';

describe('StatTileComponent', () => {
  let component: StatTileComponent;
  let fixture: ComponentFixture<StatTileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatTileComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatTileComponent);
    component = fixture.componentInstance;
    component.label = 'Total this month';
    component.value = '£100.00';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the label and value', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Total this month');
    expect(text).toContain('£100.00');
  });

  describe('delta', () => {
    it('should not render a delta when none is provided', () => {
      const deltaEl = (fixture.nativeElement as HTMLElement).querySelector(
        '.delta'
      );

      expect(deltaEl).toBeNull();
    });

    it('should render a good delta with the good class', () => {
      component.delta = '▼ £10.00 (10%)';
      component.deltaIsGood = true;
      fixture.detectChanges();

      const deltaEl = (fixture.nativeElement as HTMLElement).querySelector(
        '.delta'
      )!;

      expect(deltaEl.textContent).toContain('▼ £10.00 (10%)');
      expect(deltaEl.classList).toContain('good');
      expect(deltaEl.classList).not.toContain('bad');
    });

    it('should render a bad delta with the bad class', () => {
      component.delta = '▲ £10.00 (10%)';
      component.deltaIsGood = false;
      fixture.detectChanges();

      const deltaEl = (fixture.nativeElement as HTMLElement).querySelector(
        '.delta'
      )!;

      expect(deltaEl.classList).toContain('bad');
      expect(deltaEl.classList).not.toContain('good');
    });
  });
});

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
});

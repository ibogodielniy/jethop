import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('finds a multi-hop route between connected airports', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    const routes = (app as unknown as { engine: { findRoutes: Function } }).engine.findRoutes(
      'YYZ',
      'FCO',
      3,
    );
    expect(routes.length).toBeGreaterThan(0);
    expect(routes[0].airports[0].code).toBe('YYZ');
    expect(routes[0].airports.at(-1).code).toBe('FCO');
  });
});

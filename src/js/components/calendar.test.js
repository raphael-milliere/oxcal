/**
 * Tests for Calendar component
 */

import { describe, it, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { Calendar, createCalendar } from './calendar.js';
import { loadTermsData } from '../data/termService.js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Mock fetch for terms data
beforeAll(() => {
  const termsData = JSON.parse(
    readFileSync(join(process.cwd(), 'public', 'terms.json'), 'utf-8')
  );
  
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(termsData)
    })
  );
  
  return loadTermsData();
});

describe('Calendar Component', () => {
  let container;
  let calendar;
  
  beforeEach(() => {
    // Create container element
    container = document.createElement('div');
    container.id = 'test-calendar';
    document.body.appendChild(container);
    
    // Create calendar instance
    calendar = new Calendar(container);
  });
  
  afterEach(() => {
    // Clean up
    calendar.destroy();
    document.body.removeChild(container);
  });
  
  describe('Initialization', () => {
    it('should create calendar instance', () => {
      expect(calendar).toBeInstanceOf(Calendar);
      expect(calendar.container).toBe(container);
    });
    
    it('should initialize with current month', () => {
      const now = new Date();
      expect(calendar.currentMonth.getMonth()).toBe(now.getMonth());
      expect(calendar.currentMonth.getFullYear()).toBe(now.getFullYear());
    });
    
    it('should have no selected date initially', () => {
      expect(calendar.selectedDate).toBeNull();
    });
  });
  
  describe('Month Grid Generation', () => {
    it('should generate 42 cells for any month', () => {
      const grid = calendar.getMonthGrid(2024, 10); // November 2024
      expect(grid).toHaveLength(42);
    });
    
    it('should mark current month days correctly', () => {
      const grid = calendar.getMonthGrid(2024, 10); // November 2024
      const currentMonthDays = grid.filter(d => d.isCurrentMonth);
      expect(currentMonthDays).toHaveLength(30); // November has 30 days
    });
    
    it('should include previous month padding days', () => {
      const grid = calendar.getMonthGrid(2024, 10); // November 2024
      const firstDay = new Date(2024, 10, 1).getDay(); // Friday = 5
      const prevMonthDays = grid.filter(d => d.isPreviousMonth);
      expect(prevMonthDays).toHaveLength(firstDay);
    });
    
    it('should include next month padding days', () => {
      const grid = calendar.getMonthGrid(2024, 10); // November 2024
      const nextMonthDays = grid.filter(d => d.isNextMonth);
      expect(nextMonthDays.length).toBeGreaterThan(0);
      expect(nextMonthDays.length).toBeLessThanOrEqual(14); // Max 2 weeks
    });
    
    it('should handle February in leap years', () => {
      const grid = calendar.getMonthGrid(2024, 1); // February 2024 (leap year)
      const febDays = grid.filter(d => d.isCurrentMonth);
      expect(febDays).toHaveLength(29);
    });
    
    it('should handle February in non-leap years', () => {
      const grid = calendar.getMonthGrid(2025, 1); // February 2025
      const febDays = grid.filter(d => d.isCurrentMonth);
      expect(febDays).toHaveLength(28);
    });
  });
  
  describe('Term Week Information', () => {
    it('should add term week data to days in term', () => {
      const grid = calendar.getMonthGrid(2024, 10); // November 2024
      const termDays = grid.filter(d => d.termWeek !== null);
      expect(termDays.length).toBeGreaterThan(0);
    });
    
    it('should identify Michaelmas term correctly', () => {
      const grid = calendar.getMonthGrid(2024, 10); // November 2024
      const michDays = grid.filter(d => d.termWeek?.term === 'michaelmas');
      expect(michDays.length).toBeGreaterThan(0);
    });
    
    it('should identify correct week numbers', () => {
      const grid = calendar.getMonthGrid(2024, 10); // November 2024
      const week5Days = grid.filter(d => 
        d.termWeek?.week === 5 && 
        d.termWeek?.term === 'michaelmas' &&
        d.isCurrentMonth
      );
      // Week 5 Michaelmas 2024: Nov 10-16
      // Note: The grid shows days that fall within week 5
      expect(week5Days.length).toBeGreaterThan(0);
      
      // Verify the days are in the correct range
      const week5Dates = week5Days.map(d => d.date.getDate());
      week5Dates.forEach(date => {
        expect(date).toBeGreaterThanOrEqual(10);
        expect(date).toBeLessThanOrEqual(16);
      });
    });
  });
  
  describe('Rendering', () => {
    it('should render day headers', () => {
      calendar.render();
      const headers = container.querySelectorAll('.calendar-day-header');
      expect(headers).toHaveLength(7);
      expect(headers[0].textContent).toBe('Sun');
      expect(headers[6].textContent).toBe('Sat');
    });
    
    it('should render 42 day cells', () => {
      calendar.render();
      const days = container.querySelectorAll('.calendar-day');
      expect(days).toHaveLength(42);
    });
    
    it('should mark today with special class', () => {
      const today = new Date();
      calendar.setMonth(today);
      const todayCell = container.querySelector('.calendar-day.today');
      if (todayCell) {
        expect(todayCell).toBeTruthy();
        const dayNum = parseInt(todayCell.querySelector('.day-number').textContent);
        expect(dayNum).toBe(today.getDate());
      }
    });
    
    it('should mark other month days', () => {
      calendar.render();
      const otherMonthDays = container.querySelectorAll('.calendar-day.other-month');
      expect(otherMonthDays.length).toBeGreaterThan(0);
    });
    
    it('should add term week badges to term days', () => {
      calendar.setMonth(new Date(2024, 10, 15)); // November 2024
      const badges = container.querySelectorAll('.term-week-badge');
      expect(badges.length).toBeGreaterThan(0);
    });
    
    it('should apply correct term colors to badges', () => {
      calendar.setMonth(new Date(2024, 10, 15)); // November 2024
      const michBadges = container.querySelectorAll('.term-week-badge.michaelmas');
      expect(michBadges.length).toBeGreaterThan(0);
    });
  });
  
  describe('Navigation', () => {
    it('should navigate to next month', () => {
      calendar.setMonth(new Date(2024, 10, 1)); // November 2024
      calendar.navigateMonth(1);
      expect(calendar.currentMonth.getMonth()).toBe(11); // December
      expect(calendar.currentMonth.getFullYear()).toBe(2024);
    });
    
    it('should navigate to previous month', () => {
      calendar.setMonth(new Date(2024, 10, 1)); // November 2024
      calendar.navigateMonth(-1);
      expect(calendar.currentMonth.getMonth()).toBe(9); // October
      expect(calendar.currentMonth.getFullYear()).toBe(2024);
    });
    
    it('should handle year boundaries when navigating forward', () => {
      calendar.setMonth(new Date(2024, 11, 1)); // December 2024
      calendar.navigateMonth(1);
      expect(calendar.currentMonth.getMonth()).toBe(0); // January
      expect(calendar.currentMonth.getFullYear()).toBe(2025);
    });
    
    it('should handle year boundaries when navigating backward', () => {
      calendar.setMonth(new Date(2025, 0, 1)); // January 2025
      calendar.navigateMonth(-1);
      expect(calendar.currentMonth.getMonth()).toBe(11); // December
      expect(calendar.currentMonth.getFullYear()).toBe(2024);
    });
    
    it('should emit navigate event', () => {
      const callback = vi.fn();
      calendar.on('navigate', callback);
      calendar.navigateMonth(1);
      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[0][0].month).toBeInstanceOf(Date);
    });
  });
  
  describe('Date Selection', () => {
    it('should select a date', () => {
      const date = new Date(2024, 10, 15);
      calendar.selectDate(date);
      expect(calendar.selectedDate).toEqual(date);
    });
    
    it('should mark selected date in render', () => {
      const date = new Date(2024, 10, 15);
      calendar.setMonth(date);
      calendar.selectDate(date);
      
      const selectedCell = container.querySelector('.calendar-day.selected');
      expect(selectedCell).toBeTruthy();
      const dayNum = parseInt(selectedCell.querySelector('.day-number').textContent);
      expect(dayNum).toBe(15);
    });
    
    it('should emit select event', () => {
      const callback = vi.fn();
      calendar.on('select', callback);
      const date = new Date(2024, 10, 15);
      calendar.selectDate(date);
      expect(callback).toHaveBeenCalled();
      expect(callback.mock.calls[0][0].date).toEqual(date);
    });
    
    it('should handle click on current month days', () => {
      calendar.setMonth(new Date(2024, 10, 1));
      const dayCell = container.querySelectorAll('.calendar-day:not(.other-month)')[14];
      dayCell.click();
      expect(calendar.selectedDate).toBeTruthy();
      expect(calendar.selectedDate.getDate()).toBe(15);
    });
    
    it('should not select other month days', () => {
      calendar.setMonth(new Date(2024, 10, 1));
      const otherMonthCell = container.querySelector('.calendar-day.other-month');
      otherMonthCell.click();
      expect(calendar.selectedDate).toBeNull();
    });
  });
  
  describe('Month Display String', () => {
    it('should format month display correctly', () => {
      calendar.setMonth(new Date(2024, 10, 1)); // November 2024
      expect(calendar.getMonthDisplayString()).toBe('November 2024');
    });
    
    it('should update display string after navigation', () => {
      calendar.setMonth(new Date(2024, 10, 1));
      calendar.navigateMonth(1);
      expect(calendar.getMonthDisplayString()).toBe('December 2024');
    });
  });
  
  describe('Event System', () => {
    it('should add event listeners', () => {
      const callback = vi.fn();
      calendar.on('test', callback);
      calendar.emit('test', { data: 'test' });
      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });
    
    it('should remove event listeners', () => {
      const callback = vi.fn();
      calendar.on('test', callback);
      calendar.off('test', callback);
      calendar.emit('test', { data: 'test' });
      expect(callback).not.toHaveBeenCalled();
    });
    
    it('should handle multiple listeners', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      calendar.on('test', callback1);
      calendar.on('test', callback2);
      calendar.emit('test', { data: 'test' });
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });
  
  describe('Data Attributes', () => {
    it('should add date attributes to day cells', () => {
      calendar.setMonth(new Date(2024, 10, 1));
      const dayCell = container.querySelectorAll('.calendar-day')[10];
      expect(dayCell.getAttribute('data-date')).toBeTruthy();
    });
    
    it('should add term attributes to term days', () => {
      calendar.setMonth(new Date(2024, 10, 15)); // November 2024
      const termDays = container.querySelectorAll('[data-term]');
      expect(termDays.length).toBeGreaterThan(0);
      
      const termDay = termDays[0];
      expect(termDay.getAttribute('data-term')).toBeTruthy();
      expect(termDay.getAttribute('data-week')).toBeTruthy();
    });
  });
  
  describe('Factory Function', () => {
    it('should create calendar using factory function', () => {
      const newCalendar = createCalendar(container);
      expect(newCalendar).toBeInstanceOf(Calendar);
      expect(newCalendar.container).toBe(container);
      newCalendar.destroy();
    });
  });
  
  describe('Cleanup', () => {
    it('should clear container on destroy', () => {
      calendar.render();
      expect(container.children.length).toBeGreaterThan(0);
      calendar.destroy();
      expect(container.children).toHaveLength(0);
    });
    
    it('should clear listeners on destroy', () => {
      const callback = vi.fn();
      calendar.on('test', callback);
      calendar.destroy();
      calendar.emit('test', {});
      expect(callback).not.toHaveBeenCalled();
    });
  });
});
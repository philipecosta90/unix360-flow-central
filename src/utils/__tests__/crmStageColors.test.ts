import { describe, it, expect } from 'vitest';
import { getStageHeaderClass } from '../crmStageColors';

describe('getStageHeaderClass', () => {
  it('should return correct class for valid hex colors', () => {
    expect(getStageHeaderClass({ cor: '#3B82F6', nome: 'TEST' })).toBe('crm-stage-blue');
    expect(getStageHeaderClass({ cor: '#10B981', nome: 'TEST' })).toBe('crm-stage-emerald');
    expect(getStageHeaderClass({ cor: '#EF4444', nome: 'TEST' })).toBe('crm-stage-red');
  });

  it('should handle case-insensitive hex colors', () => {
    expect(getStageHeaderClass({ cor: '#3b82f6', nome: 'TEST' })).toBe('crm-stage-blue');
    expect(getStageHeaderClass({ cor: '#10b981', nome: 'TEST' })).toBe('crm-stage-emerald');
  });

  it('should trim whitespace from hex colors', () => {
    expect(getStageHeaderClass({ cor: '  #3B82F6  ', nome: 'TEST' })).toBe('crm-stage-blue');
  });

  it('should fall back to stage name mapping when hex color is invalid', () => {
    expect(getStageHeaderClass({ cor: '#INVALID', nome: 'LEAD' })).toBe('crm-stage-blue');
    expect(getStageHeaderClass({ cor: '#INVALID', nome: 'QUALIFICAÇÃO' })).toBe('crm-stage-amber');
    expect(getStageHeaderClass({ cor: '#INVALID', nome: 'CONTATO INICIAL' })).toBe('crm-stage-orange');
    expect(getStageHeaderClass({ cor: '#INVALID', nome: 'PROPOSTA ENVIADA' })).toBe('crm-stage-purple');
    expect(getStageHeaderClass({ cor: '#INVALID', nome: 'NEGOCIAÇÃO' })).toBe('crm-stage-pink');
    expect(getStageHeaderClass({ cor: '#INVALID', nome: 'FECHADO' })).toBe('crm-stage-emerald');
    expect(getStageHeaderClass({ cor: '#INVALID', nome: 'PERDIDO' })).toBe('crm-stage-red');
  });

  it('should handle case-insensitive stage names', () => {
    expect(getStageHeaderClass({ nome: 'lead' })).toBe('crm-stage-blue');
    expect(getStageHeaderClass({ nome: 'qualificação' })).toBe('crm-stage-amber');
    expect(getStageHeaderClass({ nome: 'contato inicial' })).toBe('crm-stage-orange');
    expect(getStageHeaderClass({ nome: 'proposta enviada' })).toBe('crm-stage-purple');
    expect(getStageHeaderClass({ nome: 'NEGOCIAÇÃO' })).toBe('crm-stage-pink');
    expect(getStageHeaderClass({ nome: 'fechado' })).toBe('crm-stage-emerald');
  });

  it('should trim whitespace from stage names', () => {
    expect(getStageHeaderClass({ nome: '  LEAD  ' })).toBe('crm-stage-blue');
  });

  it('should return gray fallback for unknown colors and names', () => {
    expect(getStageHeaderClass({ cor: '#UNKNOWN', nome: 'UNKNOWN_STAGE' })).toBe('crm-stage-gray');
    expect(getStageHeaderClass({ nome: 'UNKNOWN_STAGE' })).toBe('crm-stage-gray');
  });

  it('should prioritize hex color over stage name', () => {
    expect(getStageHeaderClass({ cor: '#EF4444', nome: 'LEAD' })).toBe('crm-stage-red');
  });

  it('should handle empty or missing color gracefully', () => {
    expect(getStageHeaderClass({ cor: '', nome: 'LEAD' })).toBe('crm-stage-blue');
    expect(getStageHeaderClass({ nome: 'FECHADO' })).toBe('crm-stage-emerald');
  });
});
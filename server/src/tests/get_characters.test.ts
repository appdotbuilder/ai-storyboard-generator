
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { charactersTable } from '../db/schema';
import { getCharacters } from '../handlers/get_characters';

describe('getCharacters', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no characters exist', async () => {
    const result = await getCharacters();
    
    expect(result).toEqual([]);
  });

  it('should return all characters from database', async () => {
    // Create test characters
    await db.insert(charactersTable)
      .values([
        {
          name: 'Hero Character',
          description: 'The main protagonist'
        },
        {
          name: 'Villain Character',
          description: 'The main antagonist'
        },
        {
          name: 'Supporting Character',
          description: null
        }
      ])
      .execute();

    const result = await getCharacters();

    expect(result).toHaveLength(3);
    
    // Check first character
    const hero = result.find(c => c.name === 'Hero Character');
    expect(hero).toBeDefined();
    expect(hero!.description).toEqual('The main protagonist');
    expect(hero!.id).toBeDefined();
    expect(hero!.created_at).toBeInstanceOf(Date);
    
    // Check second character
    const villain = result.find(c => c.name === 'Villain Character');
    expect(villain).toBeDefined();
    expect(villain!.description).toEqual('The main antagonist');
    expect(villain!.id).toBeDefined();
    expect(villain!.created_at).toBeInstanceOf(Date);
    
    // Check third character with null description
    const supporting = result.find(c => c.name === 'Supporting Character');
    expect(supporting).toBeDefined();
    expect(supporting!.description).toBeNull();
    expect(supporting!.id).toBeDefined();
    expect(supporting!.created_at).toBeInstanceOf(Date);
  });

  it('should return characters ordered by creation time', async () => {
    // Create characters with slight delay to ensure different timestamps
    await db.insert(charactersTable)
      .values({ name: 'First Character', description: 'Created first' })
      .execute();
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(charactersTable)
      .values({ name: 'Second Character', description: 'Created second' })
      .execute();

    const result = await getCharacters();

    expect(result).toHaveLength(2);
    
    // Verify all characters are present
    const firstChar = result.find(c => c.name === 'First Character');
    const secondChar = result.find(c => c.name === 'Second Character');
    
    expect(firstChar).toBeDefined();
    expect(secondChar).toBeDefined();
    expect(firstChar!.created_at).toBeInstanceOf(Date);
    expect(secondChar!.created_at).toBeInstanceOf(Date);
  });
});

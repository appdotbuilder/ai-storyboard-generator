
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { charactersTable } from '../db/schema';
import { type CreateCharacterInput } from '../schema';
import { createCharacter } from '../handlers/create_character';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateCharacterInput = {
  name: 'Test Character',
  description: 'A character for testing'
};

const testInputWithNullDescription: CreateCharacterInput = {
  name: 'Minimal Character',
  description: null
};

describe('createCharacter', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a character with description', async () => {
    const result = await createCharacter(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Character');
    expect(result.description).toEqual('A character for testing');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a character with null description', async () => {
    const result = await createCharacter(testInputWithNullDescription);

    // Basic field validation
    expect(result.name).toEqual('Minimal Character');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save character to database', async () => {
    const result = await createCharacter(testInput);

    // Query using proper drizzle syntax
    const characters = await db.select()
      .from(charactersTable)
      .where(eq(charactersTable.id, result.id))
      .execute();

    expect(characters).toHaveLength(1);
    expect(characters[0].name).toEqual('Test Character');
    expect(characters[0].description).toEqual('A character for testing');
    expect(characters[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple characters with unique IDs', async () => {
    const character1 = await createCharacter({
      name: 'Character One',
      description: 'First character'
    });

    const character2 = await createCharacter({
      name: 'Character Two',
      description: 'Second character'
    });

    expect(character1.id).not.toEqual(character2.id);
    expect(character1.name).toEqual('Character One');
    expect(character2.name).toEqual('Character Two');

    // Verify both are in database
    const allCharacters = await db.select()
      .from(charactersTable)
      .execute();

    expect(allCharacters).toHaveLength(2);
  });
});

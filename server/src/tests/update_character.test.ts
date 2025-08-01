
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { charactersTable } from '../db/schema';
import { type UpdateCharacterInput } from '../schema';
import { updateCharacter } from '../handlers/update_character';
import { eq } from 'drizzle-orm';

describe('updateCharacter', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update character name', async () => {
    // Create initial character
    const initial = await db.insert(charactersTable)
      .values({
        name: 'Original Name',
        description: 'Original description'
      })
      .returning()
      .execute();

    const testInput: UpdateCharacterInput = {
      id: initial[0].id,
      name: 'Updated Name'
    };

    const result = await updateCharacter(testInput);

    expect(result.id).toEqual(initial[0].id);
    expect(result.name).toEqual('Updated Name');
    expect(result.description).toEqual('Original description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update character description', async () => {
    // Create initial character
    const initial = await db.insert(charactersTable)
      .values({
        name: 'Test Character',
        description: 'Original description'
      })
      .returning()
      .execute();

    const testInput: UpdateCharacterInput = {
      id: initial[0].id,
      description: 'Updated description'
    };

    const result = await updateCharacter(testInput);

    expect(result.id).toEqual(initial[0].id);
    expect(result.name).toEqual('Test Character');
    expect(result.description).toEqual('Updated description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update both name and description', async () => {
    // Create initial character
    const initial = await db.insert(charactersTable)
      .values({
        name: 'Original Name',
        description: 'Original description'
      })
      .returning()
      .execute();

    const testInput: UpdateCharacterInput = {
      id: initial[0].id,
      name: 'Updated Name',
      description: 'Updated description'
    };

    const result = await updateCharacter(testInput);

    expect(result.id).toEqual(initial[0].id);
    expect(result.name).toEqual('Updated Name');
    expect(result.description).toEqual('Updated description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should set description to null', async () => {
    // Create initial character with description
    const initial = await db.insert(charactersTable)
      .values({
        name: 'Test Character',
        description: 'Original description'
      })
      .returning()
      .execute();

    const testInput: UpdateCharacterInput = {
      id: initial[0].id,
      description: null
    };

    const result = await updateCharacter(testInput);

    expect(result.id).toEqual(initial[0].id);
    expect(result.name).toEqual('Test Character');
    expect(result.description).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated character to database', async () => {
    // Create initial character
    const initial = await db.insert(charactersTable)
      .values({
        name: 'Original Name',
        description: 'Original description'
      })
      .returning()
      .execute();

    const testInput: UpdateCharacterInput = {
      id: initial[0].id,
      name: 'Updated Name',
      description: 'Updated description'
    };

    await updateCharacter(testInput);

    // Verify in database
    const characters = await db.select()
      .from(charactersTable)
      .where(eq(charactersTable.id, initial[0].id))
      .execute();

    expect(characters).toHaveLength(1);
    expect(characters[0].name).toEqual('Updated Name');
    expect(characters[0].description).toEqual('Updated description');
    expect(characters[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent character', async () => {
    const testInput: UpdateCharacterInput = {
      id: 999,
      name: 'Updated Name'
    };

    expect(updateCharacter(testInput)).rejects.toThrow(/not found/i);
  });

  it('should handle updates with no fields changed', async () => {
    // Create initial character
    const initial = await db.insert(charactersTable)
      .values({
        name: 'Test Character',
        description: 'Test description'
      })
      .returning()
      .execute();

    const testInput: UpdateCharacterInput = {
      id: initial[0].id
    };

    const result = await updateCharacter(testInput);

    expect(result.id).toEqual(initial[0].id);
    expect(result.name).toEqual('Test Character');
    expect(result.description).toEqual('Test description');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent character with no fields', async () => {
    const testInput: UpdateCharacterInput = {
      id: 999
    };

    expect(updateCharacter(testInput)).rejects.toThrow(/not found/i);
  });
});
